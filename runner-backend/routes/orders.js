const express = require('express');
const router = express.Router();
require('dotenv').config();

const { verifyToken, pool } = require('../middleware/authMiddleware');
const sendStatusEmail = require('../utils/email');

async function notifyStatusChange(orderId, status) {
    try {
        const orderRes = await pool.query(`
            SELECT o.*, c.email as customer_email, b.name as branch_name, b.address as branch_address
            FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN branches b ON o.branch_id = b.id
            WHERE o.id = $1
        `, [orderId]);

        if (orderRes.rows.length === 0) return;
        const order = orderRes.rows[0];

        if (!order.customer_email || order.customer_email.trim() === '') {
            return; // No email to send
        }

        const itemsRes = await pool.query(`
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
        `, [orderId]);

        let subject = `Bezaw Curbside: Order Status Update`;
        let title = 'Order Update';
        let message = `Your order ${order.id} status has been updated to ${status}.`;

        let details = {
            vendor: 'Bezaw Partner',
            branch: order.branch_name,
            location: order.branch_address,
            vehicle: `${order.car_color || ''} ${order.car_model || ''} (${order.car_plate || ''})`.trim(),
            paymentMethod: order.payment_method,
            items: itemsRes.rows,
            totalPrice: order.total_price,
            showReceipt: false
        };

        const upperStatus = status.toUpperCase();
        if (upperStatus === 'PREPARING') {
            title = 'Order Preparing 🍳';
            message = 'Our team is currently preparing your order. We will let you know when it is ready for pickup!';
        } else if (upperStatus === 'READY_FOR_PICKUP' || upperStatus === 'READY') {
            title = 'Order Ready! 🎁';
            message = 'Your order is packed and ready! Please proceed to the pickup zone and show your ID or QR code.';
            subject = 'Your Bezaw Order is READY!';
        } else if (['COMPLETED', 'HANDOVER_COMPLETE', 'COLLECTED', 'DELIVERED', 'PICKED_UP'].includes(upperStatus)) {
            title = 'Order Completed ✨';
            message = 'Thank you for Shopping with Bezaw! We hope you enjoyed the Addis Drive-Thru experience. Your receipt is now available for download below.';
            subject = 'Bezaw Order Receipt: Completed';
            details.showReceipt = true;
        }

        await sendStatusEmail(order.customer_email, subject, title, message, order.id, details);
    } catch (err) {
        console.error(`[Email Notification Error] Order ${orderId}: ${err.message}`);
    }
}

// Schema Sync (Lazy migration)
(async () => {
    try {
        console.log('[DB] Runner: Starting lazy migration for Tips & Fees...');
        const columns = [
            "arrived_at TIMESTAMPTZ",
            "completed_at TIMESTAMPTZ",
            "handover_time INTERVAL",
            "payment_proof_url TEXT",
            "payment_ref TEXT",
            "chapa_reference TEXT",
            "payment_status VARCHAR(50) DEFAULT 'PENDING'",
            "tip_amount DECIMAL(10,2) DEFAULT 0.00",
            "convenience_fee DECIMAL(10,2) DEFAULT 0.00"
        ];

        for (const col of columns) {
            try {
                await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ${col}`);
            } catch (err) {
                // Silently ignore if already exists
            }
        }
        console.log('[DB] Runner schema verified (Tips & Fees infrastructure).');
    } catch (e) {
        console.error('[DB Fatal] Runner schema sync failed:', e.message);
    }
})();

/**
 * Deducts stock for all items in an order.
 * Handles individual products and breaks down bundles into components.
 */
async function deductOrderStock(orderId, client = pool) {
    try {
        console.log(`[Inventory] START: Deducting stock for order ID: ${orderId}`);
        
        // 1. Get branch business type
        const branchRes = await client.query(`
            SELECT v.business_type 
            FROM orders o
            JOIN branches b ON o.branch_id = b.id
            JOIN vendors v ON b.vendor_id = v.id
            WHERE o.id = $1
        `, [orderId]);
        const businessType = branchRes.rows[0]?.business_type || '';
        const isSupermarket = businessType.toLowerCase().includes('supermarket');

        if (!isSupermarket) {
            console.log(`[Inventory] Skipping deduction for order ${orderId} (Business Type: ${businessType})`);
            return;
        }

        // 2. Get all items in the order
        const itemsRes = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);

        console.log(`[Inventory] Found ${itemsRes.rows.length} items for order ${orderId}`);

        for (const item of itemsRes.rows) {
            console.log(`[Inventory] Processing item: product_id=${item.product_id}, bundle_id=${item.bundle_id}, qty=${item.quantity}`);

            if (item.product_id) {
                // Check if tracking is ON for this product
                const pRes = await client.query('SELECT stock_quantity FROM products WHERE id = $1', [item.product_id]);
                if (pRes.rows.length > 0 && pRes.rows[0].stock_quantity === -1) {
                    console.log(`[Inventory] Skipping deduction for product ${item.product_id} (Tracking OFF)`);
                    continue;
                }

                // Deduct regular product
                const res = await client.query(
                    'UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) - $1 WHERE id = $2 RETURNING name, stock_quantity',
                    [item.quantity, item.product_id]
                );
                if (res.rows.length > 0) {
                    console.log(`[Inventory] SUCCESS: Deducted ${item.quantity} from "${res.rows[0].name}" (ID: ${item.product_id}). New stock: ${res.rows[0].stock_quantity}`);
                } else {
                    console.warn(`[Inventory] WARNING: Product ID ${item.product_id} not found!`);
                }
            } else if (item.bundle_id) {
                // Deduct bundle components
                const bundleItemsRes = await client.query(
                    'SELECT bi.product_id, bi.quantity, p.stock_quantity FROM bundle_items bi JOIN products p ON bi.product_id = p.id WHERE bi.bundle_id = $1',
                    [item.bundle_id]
                );
                console.log(`[Inventory] Bundle ${item.bundle_id} has ${bundleItemsRes.rows.length} components`);

                for (const bi of bundleItemsRes.rows) {
                    // Skip if tracking is OFF for this component
                    if (bi.stock_quantity === -1) continue;

                    const totalDeduction = bi.quantity * item.quantity;
                    const res = await client.query(
                        'UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) - $1 WHERE id = $2 RETURNING name, stock_quantity',
                        [totalDeduction, bi.product_id]
                    );
                    if (res.rows.length > 0) {
                        console.log(`[Inventory] SUCCESS (Bundle): Deducted ${totalDeduction} from "${res.rows[0].name}" (ID: ${bi.product_id}). New stock: ${res.rows[0].stock_quantity}`);
                    } else {
                        console.warn(`[Inventory] WARNING: Bundle component ID ${bi.product_id} not found!`);
                    }
                }
            }
        }
        console.log(`[Inventory] FINISH: Deduction complete for order ${orderId}`);
    } catch (err) {
        console.error(`[Inventory Error] CRITICAL: Failed to deduct stock for order ${orderId}:`, err);
        throw err;
    }
}

// Employee View (Protected - Runner/Manager)
router.get('/employee-view', verifyToken, async (req, res) => {
    try {
        console.log('GET /employee-view called');
        console.log('User:', req.user);
        const branchId = req.user.branch_id;
        console.log('Fetching orders for branch:', branchId);

        if (!branchId) {
            console.error("Branch ID missing in token");
            return res.status(400).json({ message: "Branch ID missing" });
        }

        const query = `
            SELECT o.id, o.status, o.total_price, o.created_at, o.scheduled_pickup_time, o.order_note,
                   o.car_model, o.car_plate, o.car_color,
                   o.is_gift, o.recipient_phone, o.gift_message,
                   o.vehicle_type, o.vehicle_plate, o.vehicle_color,
                   u.name as customer_name,
                   u.default_car_image,
                   json_agg(json_build_object(
                       'name', p.name, 
                       'quantity', oi.quantity,
                       'substitutionPolicy', 'Best Match'
                   )) as items
            FROM orders o
            LEFT JOIN customers u ON o.customer_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.branch_id = $1 -- Filter by Branch
            GROUP BY o.id, u.name, u.default_car_image
            ORDER BY o.created_at DESC
            LIMIT 100
        `;
        const result = await pool.query(query, [branchId]);

        // Map to Frontend Interface
        const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;

        const orders = result.rows.map(row => ({
            id: row.id,
            customerName: row.customer_name || 'Guest',
            totalPrice: row.total_price,
            status: row.status,
            createdAt: row.created_at,
            items: row.items,
            carProfile: {
                model: (row.vehicle_type && row.vehicle_type !== 'private')
                    ? (row.vehicle_type.toUpperCase() + (row.car_model ? ` (${row.car_model})` : ''))
                    : (row.car_model || 'Unknown'),
                color: row.vehicle_color || row.car_color || 'Unknown',
                plateNumber: row.vehicle_plate || row.car_plate || 'Unknown',
                image: row.default_car_image ? (row.default_car_image.startsWith('http') ? row.default_car_image : baseUrl + row.default_car_image) : null
            },
            pickupCode: row.id,
            scheduledPickupTime: row.scheduled_pickup_time,
            orderNote: row.order_note,
            isGift: row.is_gift,
            recipientPhone: row.recipient_phone,
            giftMessage: row.gift_message
        }));

        res.json(orders);
    } catch (err) {
        console.error("Order fetch error:", err);
        res.status(500).json({ message: 'Server error: ' + err.message, detail: err.stack });
    }
});

router.get('/employee-view/:id', async (req, res) => {
    try {
        // Fetch Order + Customer Info
        const orderRes = await pool.query(`
            SELECT o.*, u.name as customer_name, u.phone as customer_phone, b.name as branch_name
            FROM orders o
            LEFT JOIN customers u ON o.customer_id = u.id
            LEFT JOIN branches b ON o.branch_id = b.id
            WHERE o.id = $1
        `, [req.params.id]);

        if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

        const order = orderRes.rows[0];

        // Fetch Items
        const itemsRes = await pool.query(
            `SELECT oi.*, p.name, p.image_url 
             FROM order_items oi 
             LEFT JOIN products p ON oi.product_id = p.id 
             WHERE oi.order_id = $1`,
            [req.params.id]
        );

        // Construct Response matching App interface
        res.json({
            ...order,
            customer: {
                name: order.customer_name,
                phone: order.customer_phone
            },
            items: itemsRes.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Employee Update Status (Protected - Runner/Manager)
router.put('/employee-view/:id/status', verifyToken, async (req, res) => {
    const { status } = req.body;
    const runner_id = req.user.id; // Get runner ID from token
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const upperStatus = status.toUpperCase();
        console.log(`[Runner Admin Update] Order: ${req.params.id}, New Status: ${status}, Runner: ${runner_id}`);

        // Update status AND assign runner_id
        let query = 'UPDATE orders SET status = $1, runner_id = $2';
        const params = [status, runner_id, req.params.id];

        if (upperStatus === 'ARRIVED') {
            query += ', arrived_at = NOW()';
        } else if (['COMPLETED', 'HANDOVER_COMPLETE', 'COLLECTED', 'DELIVERED', 'PICKED_UP'].includes(upperStatus)) {
            query += ', completed_at = NOW(), handover_time = (NOW() - arrived_at)';
        }

        query += ' WHERE id = $3 RETURNING *';

        const result = await client.query(query, params);
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = result.rows[0];

        // 1. DEDUCT STOCK if completed
        if (['COMPLETED', 'HANDOVER_COMPLETE', 'COLLECTED', 'DELIVERED', 'PICKED_UP'].includes(upperStatus)) {
            console.log(`[Runner Admin Update] Triggering stock deduction for order ${order.id}`);
            await deductOrderStock(order.id, client);

            // 2. FETCH DYNAMIC DELIVERY FEE & TIP
            let deliveryFee = 10.00; // Default fallback
            try {
                const settingsRes = await client.query("SELECT value FROM system WHERE name = 'runner_delivery_fee'");
                if (settingsRes.rows.length > 0) {
                    deliveryFee = parseFloat(settingsRes.rows[0].value);
                }
            } catch (err) {
                console.error("[Wallet] Could not fetch dynamic fee from 'system' table, using 10.00 fallback:", err.message);
            }

            const tipAmount = parseFloat(order.tip_amount || 0);
            const totalPayout = deliveryFee + tipAmount;

            console.log(`[Wallet] Crediting runner ${runner_id} for Order #${order.id}. Fee: ${deliveryFee}, Tip: ${tipAmount}, Total: ${totalPayout}`);
            
            await client.query(`
                INSERT INTO runner_wallets (runner_id, total_earned, current_balance)
                VALUES ($1, $2, $2)
                ON CONFLICT (runner_id) DO UPDATE SET
                    total_earned = runner_wallets.total_earned + $2,
                    current_balance = runner_wallets.current_balance + $2,
                    last_updated = NOW()
            `, [runner_id, totalPayout]);

            // 3. LOG TRANSACTION
            const description = tipAmount > 0 
                ? `Delivery Fee (${deliveryFee}) + Tip (${tipAmount}) for Order #${order.id}`
                : `Delivery Fee for Order #${order.id}`;

            await client.query(`
                INSERT INTO runner_transactions (runner_id, amount, type, description)
                VALUES ($1, $2, 'EARNING', $3)
            `, [runner_id, totalPayout, description]);
        }

        await client.query('COMMIT');
        
        // Notify Customer asynchronously
        notifyStatusChange(order.id, status).catch(console.error);
        
        res.json(order);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Wallet/Status update error:', err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    } finally {
        client.release();
    }
});

// Get All User Orders
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Frequent Items (My Usuals)
router.get('/usuals', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id, p.name, p.price, p.image_url, COUNT(oi.product_id) as freq
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.customer_id = $1
            GROUP BY p.id, p.name, p.price, p.image_url
            ORDER BY freq DESC
            LIMIT 10
        `, [req.user.id]);

        // Ensure URLs are valid (match products.js logic if needed, but assuming DB is clean)
        // Similar to products.js logic if relative paths exist:
        const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
        const items = result.rows.map(item => {
            if (item.image_url && !item.image_url.startsWith('http')) {
                item.image_url = baseUrl + item.image_url;
            }
            return item;
        });

        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Order Status / Details
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const orderRes = await pool.query(`
            SELECT o.*, b.name as branch_name, b.map_pin, b.latitude, b.longitude, b.landmark_hint 
            FROM orders o
            LEFT JOIN branches b ON o.branch_id = b.id
            WHERE o.id = $1 AND o.customer_id = $2
        `, [req.params.id, req.user.id]);
        if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Order not found' });

        const itemsRes = await pool.query(
            `SELECT oi.*, p.name, p.image_url 
             FROM order_items oi 
             LEFT JOIN products p ON oi.product_id = p.id 
             WHERE oi.order_id = $1`,
            [req.params.id]
        );

        res.json({ ...orderRes.rows[0], items: itemsRes.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Status
// Update Status (Customer or Recipient)
router.put('/:id/status', verifyToken, async (req, res) => {
    const { status } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const upperStatus = status.toUpperCase();
        console.log(`[Runner Customer Update] Order: ${req.params.id}, New Status: ${status}`);

        // Fetch user phone to check if they are the recipient
        const userRes = await client.query('SELECT phone FROM customers WHERE id = $1', [req.user.id]);
        const userPhone = userRes.rows[0]?.phone;

        let query = 'UPDATE orders SET status = $1';
        const params = [status, req.params.id, req.user.id, userPhone];

        if (upperStatus === 'ARRIVED') {
            query += ', arrived_at = NOW()';
        } else if (['COMPLETED', 'HANDOVER_COMPLETE', 'COLLECTED', 'DELIVERED', 'PICKED_UP'].includes(upperStatus)) {
            query += ', completed_at = NOW(), handover_time = (NOW() - arrived_at)';
        }

        // Allow update if User is the Buyer (customer_id) OR the Recipient (recipient_phone)
        query += ' WHERE id = $2 AND (customer_id = $3 OR recipient_phone = $4) RETURNING *';

        const result = await client.query(query, params);
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Order not found or unauthorized' });
        }

        const order = result.rows[0];

        // DEDUCT STOCK if completed
        if (['COMPLETED', 'HANDOVER_COMPLETE', 'COLLECTED', 'DELIVERED', 'PICKED_UP'].includes(upperStatus)) {
            console.log(`[Runner Customer Update] Triggering stock deduction for order ${order.id}`);
            await deductOrderStock(order.id, client);
        }

        await client.query('COMMIT');
        
        // Notify Customer asynchronously
        notifyStatusChange(order.id, status).catch(console.error);
        
        res.json(order);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
});

// Assign Gift Recipient
router.put('/:id/gift-assign', verifyToken, async (req, res) => {
    const { recipient_phone, gift_message } = req.body;
    try {
        const result = await pool.query(
            'UPDATE orders SET recipient_phone = $1, gift_message = $2, is_gift = true WHERE id = $3 AND customer_id = $4 RETURNING *',
            [recipient_phone, gift_message, req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error assigning gift' });
    }
});

// Fetch My Received Gifts (Where I am the Recipient)
router.get('/my-received', verifyToken, async (req, res) => {
    try {
        // Fetch phone of logged-in user
        const userRes = await pool.query('SELECT phone FROM customers WHERE id = $1', [req.user.id]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const phone = userRes.rows[0].phone;

        // Fetch orders where this user is the recipient
        const result = await pool.query(`
            SELECT o.*, b.name as branch_name, 
                   json_agg(json_build_object(
                       'name', p.name, 
                       'quantity', oi.quantity, 
                       'image_url', p.image_url
                   )) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN branches b ON o.branch_id = b.id
            WHERE o.recipient_phone = $1 AND o.is_gift = true
            GROUP BY o.id, b.name
            ORDER BY o.created_at DESC
        `, [phone]);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching gifts' });
    }
});

// Create Order (Checkout)
router.post('/', verifyToken, async (req, res) => {
    console.log("POST /api/orders Body:", req.body); // Debug Log

    const { branch_id, car_model, car_plate, car_color, scheduled_pickup_time, use_wallet, donation_amount } = req.body;

    // Robust extraction (Snake case vs Camel case)
    const is_gift = req.body.is_gift || req.body.isGift || false;
    const recipient_phone = req.body.recipient_phone || req.body.recipientPhone || null;
    const gift_message = req.body.gift_message || req.body.giftMessage || null;
    const vehicle_type = req.body.vehicle_type || req.body.vehicleType || 'private';
    const vehicle_plate = req.body.vehicle_plate || req.body.vehiclePlate || car_plate;
    const vehicle_color = req.body.vehicle_color || req.body.vehicleColor || car_color;

    const customer_id = req.user.id;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Fetch Cart Items (Products AND Bundles)
        const cartRes = await client.query(
            `SELECT 
                c.*, 
                p.price as product_price, 
                b.price as bundle_price,
                b.branch_id as bundle_branch_id
             FROM cart_items c 
             LEFT JOIN products p ON c.product_id = p.id 
             LEFT JOIN bundles b ON c.bundle_id = b.id 
             WHERE c.customer_id = $1`,
            [customer_id]
        );

        if (cartRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // 2. Calculate Total & Find Branch
        let total_price = 0;
        let valid_branch_id = branch_id; // Default to request body
        const orderItems = [];

        for (const item of cartRes.rows) {
            // Determine price
            const price = Number(item.product_price || item.bundle_price || 0);
            total_price += price * item.quantity;

            // PRE-ORDER STOCK CHECK
            if (item.product_id) {
                const prodRes = await client.query('SELECT name, stock_quantity FROM products WHERE id = $1', [item.product_id]);
                const prod = prodRes.rows[0];
                if (prod && prod.stock_quantity != null && prod.stock_quantity < item.quantity) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ message: `Insufficient stock for ${prod.name}. Only ${prod.stock_quantity} left.` });
                }
            } else if (item.bundle_id) {
                const bundleItemsRes = await client.query(
                    'SELECT bi.quantity as bi_qty, p.name, p.stock_quantity FROM bundle_items bi JOIN products p ON bi.product_id = p.id WHERE bi.bundle_id = $1',
                    [item.bundle_id]
                );
                for (const bi of bundleItemsRes.rows) {
                    const totalNeeded = bi.bi_qty * item.quantity;
                    if (bi.stock_quantity != null && bi.stock_quantity < totalNeeded) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({ message: `Insufficient stock for bundle component: ${bi.name}. Need ${totalNeeded}, but only ${bi.stock_quantity} left.` });
                    }
                }
            }

            // Prefer bundle's branch if available (auto-detection)
            if (item.bundle_branch_id) {
                valid_branch_id = item.bundle_branch_id;
            }

            orderItems.push({
                product_id: item.product_id, // can be null
                bundle_id: item.bundle_id,   // can be null
                quantity: item.quantity,
                price: price
            });
        }

        // Feature 42: Donation
        if (donation_amount && Number(donation_amount) > 0) {
            total_price += Number(donation_amount);
        }

        // Final fallback: check if valid_branch_id exists, if not get ANY branch
        // This prevents FK violation from frontend hardcoded dummy IDs
        const checkBranch = await client.query('SELECT id FROM branches WHERE id = $1', [valid_branch_id]);
        if (checkBranch.rows.length === 0) {
            const anyBranch = await client.query('SELECT id FROM branches LIMIT 1');
            if (anyBranch.rows.length > 0) {
                valid_branch_id = anyBranch.rows[0].id;
            }
        }

        // 3. Create Order       
        const orderRes = await client.query(
            `INSERT INTO orders (branch_id, customer_id, total_price, car_model, car_plate, car_color, status, scheduled_pickup_time, is_gift, recipient_phone, gift_message, vehicle_type, vehicle_plate, vehicle_color)
             VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [
                valid_branch_id, customer_id, total_price,
                car_model, car_plate, car_color,
                scheduled_pickup_time || null,
                is_gift,
                recipient_phone,
                gift_message,
                vehicle_type,
                vehicle_plate,
                vehicle_color
            ]
        );
        const orderID = orderRes.rows[0].id;

        // 4. Insert Order Items
        for (const item of orderItems) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, bundle_id, quantity, price_at_purchase)
                 VALUES ($1, $2, $3, $4, $5)`,
                [orderID, item.product_id, item.bundle_id, item.quantity, item.price]
            );
        }

        // 5. Clear Cart
        await client.query('DELETE FROM cart_items WHERE customer_id = $1', [customer_id]);

        // 6. Award Loyalty Points (1 Point per 100 ETB)
        const pointsEarned = Math.floor(total_price / 100);
        if (pointsEarned > 0) {
            await client.query(
                'UPDATE customers SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2',
                [pointsEarned, customer_id]
            );
        }

        // Feature 48: Split Pay / Wallet
        if (use_wallet === true) {
            const userRes = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [customer_id]);
            const balance = Number(userRes.rows[0].wallet_balance || 0);
            if (balance > 0) {
                const toDeduct = Math.min(balance, total_price);
                await client.query('UPDATE customers SET wallet_balance = wallet_balance - $1 WHERE id = $2', [toDeduct, customer_id]);
            }
        }

        await client.query('COMMIT');

        res.json({
            ...orderRes.rows[0],
            message: 'Order created successfully',
            points_earned: pointsEarned
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Order creation failed:', err);
        res.status(500).json({ message: 'Failed to create order', error: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
