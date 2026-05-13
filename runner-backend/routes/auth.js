const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const { pool } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
}

// Nodemailer setup
const transporter = nodemailer.createTransport({
    host: process.env.SUPPORT_EMAIL_HOST,
    port: process.env.SUPPORT_EMAIL_PORT,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SUPPORT_EMAIL_USER,
        pass: process.env.SUPPORT_EMAIL_PASS,
    },
});

// 1. Customer Signup
console.log('Loading auth routes...');
router.post('/customer/signup', async (req, res) => {
    const { name, phone, password, car_plate, car_model, car_color } = req.body;

    if (!name || !phone || !password) {
        return res.status(400).json({ message: 'Name, Phone and Password are required' });
    }

    try {
        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM customers WHERE phone = $1', [phone]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User with this phone already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Insert new user
        const result = await pool.query(
            `INSERT INTO customers (
                name, phone, password_hash, 
                default_car_plate, default_car_model, default_car_color
            ) VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id, name, phone, default_car_plate, default_car_model, default_car_color`,
            [name, phone, hash, car_plate, car_model, car_color]
        );

        const customer = result.rows[0];
        const token = jwt.sign({ id: customer.id, role: 'customer' }, JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({ token, user: customer });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during signup: ' + err.message });
    }
});

// 2. Customer Login
router.post('/customer/login', async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.status(400).json({ message: 'Phone and Password are required' });
    }

    try {
        const result = await pool.query('SELECT * FROM customers WHERE phone = $1', [phone]);
        const customer = result.rows[0];

        console.log('Login attempt for:', phone);
        console.log('User found:', customer ? customer.id : 'No');

        if (!customer) {
            return res.status(400).json({ message: 'Invalid credentials (User not found)' });
        }

        // Check if they have a password set (legacy users might not if we migrated)
        if (!customer.password_hash) {
            return res.status(400).json({ message: 'Please reset your password or contact support.' });
        }

        console.log('Comparing password:', password, 'with hash:', customer.password_hash ? 'Present' : 'Missing');
        const isMatch = await bcrypt.compare(password, customer.password_hash);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials (Password mismatch)' });
        }

        const token = jwt.sign({ id: customer.id, role: 'customer' }, JWT_SECRET, { expiresIn: '30d' });

        // Don't send password hash back
        delete customer.password_hash;

        res.json({ token, user: customer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// 3. Manager Login (unchanged)
router.post('/manager/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM managers WHERE email = $1', [email]);
        const manager = result.rows[0];
        if (!manager) return res.status(400).json({ message: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, manager.password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ id: manager.id, branch_id: manager.branch_id, role: 'manager' }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: manager.id, name: manager.name, email: manager.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// 4. Runner Login (ID only)
router.post('/runner/login', async (req, res) => {
    const { id } = req.body;

    if (!id) return res.status(400).json({ message: 'Runner ID is required' });

    try {
        // Fetch runner + branch name + supermarket name
        const result = await pool.query(`
            SELECT r.*,
                   b.name as branch_name, 
                   v.name as vendor_name 
            FROM runners r
            LEFT JOIN branches b ON r.branch_id = b.id
            LEFT JOIN vendors v ON b.vendor_id = v.id
            WHERE r.id = $1
        `, [id]);

        const runner = result.rows[0];

        if (!runner) {
            return res.status(404).json({ message: 'Runner ID not found' });
        }

        // Check if runner is inactive (Case-insensitive check)
        if (runner.status && runner.status.toUpperCase() === 'INACTIVE') {
            return res.status(403).json({ message: 'your access to the bezaw runner portal is INACTIVE.' });
        }

        // --- PASSWORD CHECK LOGIC ---
        // If the runner does NOT have a password hash, they need to set one up
        if (!runner.password_hash) {
            return res.status(200).json({ requires_setup: true, message: 'Please set up your password.' });
        }

        // If they DO have a password, they MUST provide it
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const isMatch = await bcrypt.compare(password, runner.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({
            id: runner.id,
            role: 'runner',
            branch_id: runner.branch_id
        }, JWT_SECRET, { expiresIn: '365d' }); // Long expiry for runners

        res.json({
            token,
            user: {
                id: runner.id,
                role: 'runner',
                name: runner.full_name || runner.name || 'Runner', // Robust fallback
                branch_name: runner.branch_name,
                supermarket_name: runner.vendor_name,
                pro_image: runner.pro_image
            }
        });

    } catch (err) {
        console.error('Runner login error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// 5. Runner Setup Password
router.post('/runner/setup-password', async (req, res) => {
    const { id, password } = req.body;

    if (!id || !password) {
        return res.status(400).json({ message: 'Runner ID and Password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        // First ensure the column exists (safe to run multiple times if we catch the error)
        try {
            await pool.query('ALTER TABLE runners ADD COLUMN password_hash VARCHAR(255)');
        } catch (e) {
            // Column likely already exists, ignore
        }

        const result = await pool.query('SELECT * FROM runners WHERE id = $1', [id]);
        const runner = result.rows[0];

        if (!runner) {
            return res.status(404).json({ message: 'Runner not found' });
        }

        if (runner.password_hash) {
            return res.status(400).json({ message: 'Password is already set. Please login normally.' });
        }

        // Hash and save
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await pool.query('UPDATE runners SET password_hash = $1 WHERE id = $2', [hash, id]);

        // Now issue token just like login
        const token = jwt.sign({
            id: runner.id,
            role: 'runner',
            branch_id: runner.branch_id
        }, JWT_SECRET, { expiresIn: '365d' });

        res.json({
            token,
            user: {
                id: runner.id,
                role: 'runner',
                name: runner.full_name || runner.name || 'Runner',
                branch_name: runner.branch_name,
                supermarket_name: runner.vendor_name
            }
        });

    } catch (err) {
        console.error('Runner setup password error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// 6. Runner Forgot Password - Request OTP
router.post('/runner/forgot-password', async (req, res) => {
    const { id } = req.body;

    if (!id) return res.status(400).json({ message: 'Runner ID is required' });

    try {
        const result = await pool.query('SELECT id, full_name, email FROM runners WHERE id = $1', [id]);
        const runner = result.rows[0];

        if (!runner) {
            return res.status(404).json({ message: 'Runner ID not found' });
        }

        if (!runner.email) {
            return res.status(400).json({ message: 'No email associated with this account. Please contact support.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);

        // Create a temporary token containing the OTP hash (stateless verification)
        const resetToken = jwt.sign(
            { id: runner.id, otp_hash: otpHash },
            JWT_SECRET,
            { expiresIn: '10m' }
        );

        // Send Email
        const mailOptions = {
            from: `"Bezaw Operations" <${process.env.SUPPORT_EMAIL_USER}>`,
            to: runner.email,
            subject: `Bezaw runner - OTP verification code`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Inter', -apple-system, sans-serif;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #0F172A; border-radius: 32px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.15);">
                                    <!-- Header -->
                                    <tr>
                                        <td align="center" style="padding: 40px 40px 20px 40px;">
                                            <div style="background-color: #1E293B; width: 80px; height: 80px; border-radius: 20px; padding: 10px; display: inline-block;">
                                                <img src="https://runnerapi.bezawcurbside.com/uploads/Bezaw logo (2).png" alt="Bezaw" width="60" style="display: block;">
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    <!-- Body -->
                                    <tr>
                                        <td style="padding: 0 40px 40px 40px; text-align: center;">
                                            <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 900; margin: 0 0 10px 0; letter-spacing: -0.5px;">Verification Code</h1>
                                            <p style="color: #94A3B8; font-size: 14px; margin: 0 0 30px 0; line-height: 1.5;">Hello ${runner.full_name || 'Runner'}, use the code below to securely reset your password.</p>
                                            
                                            <!-- OTP Card -->
                                            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; border-radius: 24px; margin-bottom: 30px;">
                                                <div style="color: #FFFFFF; font-size: 42px; font-weight: 900; letter-spacing: 12px; margin-left: 12px;">${otp}</div>
                                            </div>
                                            
                                            <div style="background-color: rgba(255,255,255,0.03); border-radius: 16px; padding: 15px; border: 1px solid rgba(255,255,255,0.05);">
                                                <p style="color: #64748B; font-size: 12px; margin: 0;">This code will expire in <strong style="color: #10B981;">10 minutes</strong>. If you didn't request this, please ignore this email or contact security.</p>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 30px 40px; background-color: #1E293B; text-align: center;">
                                            <div style="display: inline-block; padding: 6px 12px; background-color: rgba(16, 185, 129, 0.1); border-radius: 100px; margin-bottom: 15px;">
                                                <span style="color: #10B981; font-size: 10px; font-weight: 900; letter-spacing: 1px;">SECURE ACCESS PORTAL</span>
                                            </div>
                                            <p style="color: #475569; font-size: 11px; margin: 0;">&copy; 2026 Bezaw Curbside. All rights reserved.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'OTP sent to your registered email',
            token: resetToken, // Frontend will send this back for verification
            email_preview: runner.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Masked email
        });

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Failed to send OTP: ' + err.message });
    }
});

// 7. Runner Reset Password - Verify OTP & Set New Password
router.post('/runner/reset-password', async (req, res) => {
    const { id, otp, new_password, token } = req.body;

    if (!id || !otp || !new_password || !token) {
        return res.status(400).json({ message: 'All fields and token are required' });
    }

    try {
        // Verify the temporary token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.id !== id) {
            return res.status(400).json({ message: 'Invalid token for this ID' });
        }

        // Verify OTP
        const isMatch = await bcrypt.compare(otp, decoded.otp_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(new_password, salt);

        // Update password
        await pool.query('UPDATE runners SET password_hash = $1 WHERE id = $2', [hash, id]);

        res.json({ success: true, message: 'Password reset successfully. You can now log in.' });

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Reset failed: ' + err.message });
    }
});

module.exports = router;
