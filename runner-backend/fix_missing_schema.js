const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixSchema() {
    try {
        console.log("Fixing schema...");

        // 1. Customers Table Updates
        await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;`);
        await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_car_plate VARCHAR(50);`);
        await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_car_model VARCHAR(50);`);
        await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_car_color VARCHAR(50);`);
        console.log("Customers table updated.");

        // 2. Bundles Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bundles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                image_url TEXT,
                branch_id UUID REFERENCES branches(id), 
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Bundles table checked/created.");

        // 3. Bundle Items Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bundle_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(id),
                quantity INTEGER DEFAULT 1
            );
        `);
        console.log("Bundle Items table checked/created.");

        // 4. Cart Items Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
                product_id UUID REFERENCES products(id),
                bundle_id UUID REFERENCES bundles(id),
                quantity INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Cart Items table checked/created.");

        console.log("Schema fix complete!");
    } catch (err) {
        console.error("Error fixing schema:", err);
    } finally {
        pool.end();
    }
}

fixSchema();
