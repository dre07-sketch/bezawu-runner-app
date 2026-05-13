const express = require('express');
const router = express.Router();
const { verifyToken, pool } = require('../middleware/authMiddleware');

// GET /api/wallet
// Fetch runner's current balance and basic stats
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT total_earned, total_withdrawn, current_balance, last_updated FROM runner_wallets WHERE runner_id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            // If no wallet exists, return empty defaults
            return res.json({
                success: true,
                data: {
                    total_earned: 0,
                    total_withdrawn: 0,
                    current_balance: 0,
                    last_updated: null
                }
            });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error fetching wallet:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// GET /api/wallet/transactions
// Fetch transaction history
router.get('/transactions', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, amount, type, status, description, created_at FROM runner_transactions WHERE runner_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

const axios = require('axios');

// ... (previous GET routes)

// POST /api/wallet/withdraw
// Request a cash-out (Saves as PENDING for admin approval)
router.post('/withdraw', verifyToken, async (req, res) => {
    const runner_id = req.user.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Fetch wallet balance
        const walletRes = await client.query(
            'SELECT current_balance FROM runner_wallets WHERE runner_id = $1',
            [runner_id]
        );

        if (walletRes.rows.length === 0) throw new Error('Wallet not found');

        const amount = parseFloat(walletRes.rows[0].current_balance);

        // 2. Security Checks
        if (amount < 100) {
            return res.status(400).json({ message: 'Minimum withdrawal amount is 100 ETB' });
        }

        // 3. Check for existing pending requests to prevent duplicates
        const pendingRes = await client.query(
            "SELECT id FROM runner_transactions WHERE runner_id = $1 AND status = 'PENDING' AND type = 'WITHDRAWAL'",
            [runner_id]
        );
        if (pendingRes.rows.length > 0) {
            return res.status(400).json({ message: 'You already have a pending withdrawal request' });
        }

        // 4. "Freeze" the balance (Deduct from current_balance)
        await client.query(`
            UPDATE runner_wallets 
            SET current_balance = current_balance - $1, 
                last_updated = NOW()
            WHERE runner_id = $2
        `, [amount, runner_id]);

        // 5. Create PENDING Transaction Record
        const reference = `REQ-${runner_id}-${Date.now()}`;
        await client.query(`
            INSERT INTO runner_transactions (runner_id, amount, type, status, description)
            VALUES ($1, $2, 'WITHDRAWAL', 'PENDING', $3)
        `, [runner_id, amount, `Pending Withdrawal Request (${reference})`]);

        await client.query('COMMIT');

        res.json({ 
            success: true, 
            message: `Request submitted! Your ${amount} ETB is now pending admin approval.`,
            status: 'PENDING'
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Withdrawal request failed:', err.message);
        res.status(500).json({ message: 'Request failed', error: err.message });
    } finally {
        client.release();
    }
});

// --- ADMIN ROUTES (For Super Admin Panel) ---

// GET /api/wallet/admin/pending
// Fetch all pending withdrawal requests for review
router.get('/admin/pending', verifyToken, async (req, res) => {
    // Note: In production, add a check to ensure req.user.role === 'admin'
    try {
        const result = await pool.query(`
            SELECT t.id, t.amount, t.created_at, t.runner_id, r.full_name, r.phone_number, r.bank_code, r.account_number, r.account_name
            FROM runner_transactions t
            JOIN runners r ON t.runner_id = r.id
            WHERE t.type = 'WITHDRAWAL' AND t.status = 'PENDING'
            ORDER BY t.created_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching pending requests' });
    }
});

// POST /api/wallet/admin/approve/:id
// Approve and process a payout via Chapa
router.post('/admin/approve/:id', verifyToken, async (req, res) => {
    const transactionId = req.params.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Fetch transaction and runner details
        const transRes = await client.query(`
            SELECT t.*, r.bank_code, r.account_number, r.account_name
            FROM runner_transactions t
            JOIN runners r ON t.runner_id = r.id
            WHERE t.id = $1 AND t.status = 'PENDING'
        `, [transactionId]);

        if (transRes.rows.length === 0) throw new Error('Pending transaction not found');
        const transaction = transRes.rows[0];

        // 2. Get Chapa Secret Key
        const settingsRes = await client.query("SELECT value FROM system WHERE name = 'chapa_secret_key'");
        const chapaSecret = settingsRes.rows[0]?.value;
        if (!chapaSecret) throw new Error('Chapa Secret Key not configured');

        // 3. CALL CHAPA API
        const axios = require('axios');
        const reference = `TXN-RUN-APP-${transaction.id}-${Date.now()}`;
        
        const chapaRes = await axios.post('https://api.chapa.co/v1/transfers', {
            account_name: transaction.account_name,
            account_number: transaction.account_number,
            amount: transaction.amount,
            currency: "ETB",
            reference: reference,
            bank_code: transaction.bank_code
        }, {
            headers: { Authorization: `Bearer ${chapaSecret.trim()}` }
        });

        if (chapaRes.data.status !== 'success') throw new Error('Chapa Payout Failed');

        // 4. Finalize Wallet & Transaction
        await client.query(`
            UPDATE runner_wallets 
            SET total_withdrawn = total_withdrawn + $1, last_updated = NOW()
            WHERE runner_id = $2
        `, [transaction.amount, transaction.runner_id]);

        await client.query(`
            UPDATE runner_transactions 
            SET status = 'PROCESSING', chapa_reference = $1, description = $2, created_at = NOW()
            WHERE id = $3
        `, [reference, `Payout processing via Chapa (${reference})`, transactionId]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Payout Approved and is now Processing!', reference });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Approval failed:', err.message);
        res.status(500).json({ message: 'Approval failed', error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/wallet/admin/overview
// Fetch all runner wallets for monitoring
router.get('/admin/overview', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.id, r.full_name, r.phone_number, w.current_balance, w.total_earned, w.total_withdrawn, w.last_updated
            FROM runners r
            LEFT JOIN runner_wallets w ON r.id = w.runner_id
            ORDER BY w.current_balance DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching wallet overview' });
    }
});

// POST /api/wallet/admin/adjust
// Manually adjust a runner's balance (Admin only)
router.post('/admin/adjust', verifyToken, async (req, res) => {
    const { runner_id, amount, type, description } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Update Wallet
        await client.query(`
            UPDATE runner_wallets 
            SET current_balance = current_balance + $1, 
                total_earned = total_earned + (CASE WHEN $1 > 0 THEN $1 ELSE 0 END),
                last_updated = NOW()
            WHERE runner_id = $2
        `, [amount, runner_id]);

        // 2. Log Adjustment
        await client.query(`
            INSERT INTO runner_transactions (runner_id, amount, type, status, description)
            VALUES ($1, ABS($2), $3, 'COMPLETED', $4)
        `, [runner_id, amount, type, description || 'Admin Manual Adjustment']);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Balance adjusted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Adjustment failed' });
    } finally {
        client.release();
    }
});

module.exports = router;
