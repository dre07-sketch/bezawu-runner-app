const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function deepDebug() {
    try {
        const client = await pool.connect();

        console.log("-- COLUMNS --");
        const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
        cols.rows.forEach(r => console.log(r.column_name));
        console.log("-------------");

        console.log("Dropping and Re-adding...");
        await client.query("ALTER TABLE orders DROP COLUMN IF EXISTS handover_time");
        await client.query("ALTER TABLE orders ADD COLUMN handover_time TIMESTAMPTZ");

        console.log("Update Test...");
        await client.query("UPDATE orders SET handover_time = NOW() WHERE id = (SELECT id FROM orders LIMIT 1)");
        console.log("SUCCESS!");

        client.release();
    } catch (err) {
        console.log("FAIL:", err.message);
    } finally {
        pool.end();
    }
}
deepDebug();
