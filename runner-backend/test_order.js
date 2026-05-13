require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testOrder() {
    const client = await pool.connect();
    try {
        console.log('Testing Order Creation...');

        // 1. Get Customer and Branch
        const custRes = await client.query('SELECT id FROM customers LIMIT 1');
        const branchRes = await client.query('SELECT id FROM branches LIMIT 1');
        const bundleRes = await client.query('SELECT id, price FROM bundles LIMIT 1');

        if (!custRes.rows[0] || !branchRes.rows[0] || !bundleRes.rows[0]) {
            console.log('Missing data:', { cust: custRes.rows.length, branch: branchRes.rows.length, bundle: bundleRes.rows.length });
            return;
        }

        const customer_id = custRes.rows[0].id;
        const branch_id = branchRes.rows[0].id;
        const bundle_id = bundleRes.rows[0].id;
        const bundle_price = bundleRes.rows[0].price;

        console.log('Using:', { customer_id, branch_id, bundle_id });

        // 2. Clear Cart & Add Bundle
        await client.query('DELETE FROM cart_items WHERE customer_id = $1', [customer_id]);
        await client.query(`
            INSERT INTO cart_items (customer_id, bundle_id, quantity)
            VALUES ($1, $2, 1)
        `, [customer_id, bundle_id]);

        // 3. Mimic Logic
        const cartRes = await client.query(
            `SELECT 
                c.*, 
                p.price as product_price, 
                b.price as bundle_price 
             FROM cart_items c 
             LEFT JOIN products p ON c.product_id = p.id 
             LEFT JOIN bundles b ON c.bundle_id = b.id 
             WHERE c.customer_id = $1`,
            [customer_id]
        );

        let total_price = 0;
        const orderItems = [];
        for (const item of cartRes.rows) {
            const price = Number(item.product_price || item.bundle_price || 0);
            total_price += price * item.quantity;

            orderItems.push({
                product_id: item.product_id, // can be null
                bundle_id: item.bundle_id,   // can be null
                quantity: item.quantity,
                price: price
            });
        }

        console.log('Calculated Total:', total_price);
        console.log('Order Items:', orderItems);

        await client.query('BEGIN');

        const orderRes = await client.query(
            `INSERT INTO orders (branch_id, customer_id, total_price, car_model, car_plate, car_color, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
             RETURNING *`,
            [branch_id, customer_id, total_price, 'Test Car', 'PLATE', 'Red']
        );
        const orderID = orderRes.rows[0].id;

        for (const item of orderItems) {
            console.log('Inserting item:', item);
            await client.query(
                `INSERT INTO order_items (order_id, product_id, bundle_id, quantity, price_at_purchase)
                 VALUES ($1, $2, $3, $4, $5)`,
                [orderID, item.product_id, item.bundle_id, item.quantity, item.price]
            );
        }

        await client.query('COMMIT');
        console.log('Order created successfully!');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('TEST FAILED:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

testOrder();
