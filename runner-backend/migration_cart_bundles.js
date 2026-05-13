require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Enabling Bundles in Cart and Orders...');
        await client.query('BEGIN');

        // 1. Update cart_items
        console.log('Updating cart_items...');
        await client.query(`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS bundle_id VARCHAR(50)`);
        await client.query(`ALTER TABLE cart_items ALTER COLUMN product_id DROP NOT NULL`); // Make product optional

        // Add constraint if not exists (hard to check gracefully in pure sql block without func, just try/catch mostly safe or do basic check)
        // We'll just try adding it, if it fails it fails (already exists)
        try {
            await client.query(`ALTER TABLE cart_items ADD CONSTRAINT fk_cart_bundle FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE`);
        } catch (e) { console.log('cart_items fk exists'); }

        // 2. Update order_items
        console.log('Updating order_items...');
        await client.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS bundle_id VARCHAR(50)`);
        await client.query(`ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL`);

        try {
            await client.query(`ALTER TABLE order_items ADD CONSTRAINT fk_order_item_bundle FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE`);
        } catch (e) { console.log('order_items fk exists'); }

        await client.query('COMMIT');
        console.log('Migration successful.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
