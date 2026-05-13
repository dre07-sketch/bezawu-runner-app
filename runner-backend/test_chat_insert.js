const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function test() {
    try {
        const orderId = 'BZWOR-635929';
        const senderType = 'CUSTOMER';
        const message = 'Test message from debugger';

        console.log("Attempting Insert...");
        const r = await pool.query(
            'INSERT INTO order_chats (order_id, sender_type, message) VALUES ($1, $2, $3) RETURNING *',
            [orderId, senderType, message]
        );
        console.log("Success:", r.rows[0]);
        pool.end();
    } catch (err) {
        console.error("INSERT FAILED:");
        console.error(err);
        pool.end();
    }
}
test();
