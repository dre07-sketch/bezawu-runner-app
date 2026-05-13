const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fix() {
    try {
        const client = await pool.connect();
        console.log(`Connected to ${process.env.DB_NAME} at ${process.env.DB_HOST}`);

        // Force add columns by trying to catch duplicate error or just using IF NOT EXISTS (which worked before? maybe not)
        // Let's print existing columns first
        const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'");
        console.log("Current Columns:", cols.rows.map(r => r.column_name).join(', '));

        console.log('Patching schema...');
        await client.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS handover_time TIMESTAMPTZ;
        `);
        console.log('Schema patched.');

        client.release();
    } catch (err) {
        console.error('Fix failed:', err.message);
    } finally {
        await pool.end();
    }
}

fix();
