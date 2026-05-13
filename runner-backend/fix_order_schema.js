require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixSchema() {
    const client = await pool.connect();
    try {
        console.log('Forcing product_id to be NULLABLE in order_items...');
        await client.query('ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL');

        console.log('Adding specific constraint for bundle_id if missing...');
        // Just in case migration failed
        await client.query('ALTER TABLE order_items ADD COLUMN IF NOT EXISTS bundle_id VARCHAR(50)');

        console.log('Schema fix applied.');
    } catch (e) {
        console.error('Schema fix error:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

fixSchema();
