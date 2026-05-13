require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const migrationSql = `
BEGIN;

-- 1. Enhance Customers Table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS fcm_token TEXT,
ADD COLUMN IF NOT EXISTS default_car_plate VARCHAR(50),
ADD COLUMN IF NOT EXISTS default_car_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS default_car_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_picture TEXT,
ADD COLUMN IF NOT EXISTS language_pref VARCHAR(5) DEFAULT 'en';

-- 2. Enhance Products Table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_fasting BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'pc',
ADD COLUMN IF NOT EXISTS discount_price DECIMAL(12, 2);

-- 3. Enhance Orders Table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'CASH',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING';

-- 4. Create Order Items Table (Critical Missing Piece)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
`;

async function runMigration() {
    try {
        const client = await pool.connect();
        console.log('Running migration...');

        await client.query(migrationSql);

        console.log('Migration successful!');

        // Verify changes
        const customerCols = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'customers'
    `);
        console.log('Customer columns:', customerCols.rows.map(r => r.column_name).join(', '));

        const orderItems = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'order_items'
    `);
        console.log('New Tables:', orderItems.rows.map(r => r.table_name).join(', '));

        client.release();
        await pool.end();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
