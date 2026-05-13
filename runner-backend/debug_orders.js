const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkOrders() {
    try {
        const res = await pool.query(`
            SELECT id, created_at, is_gift, recipient_phone, customer_id, total_price 
            FROM orders 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        console.log("\n--- RECENT ORDERS ---");
        // console.table(res.rows);
        res.rows.forEach(r => console.log(JSON.stringify(r)));
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkOrders();
