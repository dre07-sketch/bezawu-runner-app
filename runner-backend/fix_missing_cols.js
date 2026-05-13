const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bezaw',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function fixSchema() {
    try {
        console.log("Checking and fixing schema...");

        // 1. Add order_note to orders
        await pool.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS order_note TEXT;
        `);
        console.log("Checked/Added orders.order_note");

        // 2. Add default_car_image to customers
        await pool.query(`
            ALTER TABLE customers 
            ADD COLUMN IF NOT EXISTS default_car_image TEXT;
        `);
        console.log("Checked/Added customers.default_car_image");

        // 3. Add vehicle type/plate/color just in case
        await pool.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) DEFAULT 'private',
            ADD COLUMN IF NOT EXISTS vehicle_plate VARCHAR(50),
            ADD COLUMN IF NOT EXISTS vehicle_color VARCHAR(50);
        `);
        console.log("Checked/Added orders.vehicle info");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

fixSchema();
