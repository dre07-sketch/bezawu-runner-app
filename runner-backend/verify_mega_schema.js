const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function check() {
    try {
        const client = await pool.connect();

        const tables = ['customers', 'products', 'orders', 'chat_messages', 'flash_deals', 'gift_codes', 'stock_alerts', 'stories', 'shared_carts'];

        for (const table of tables) {
            console.log(`\n--- ${table.toUpperCase()} Columns ---`);
            const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(res.rows.map(r => r.column_name).join(', '));
        }

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
check();
