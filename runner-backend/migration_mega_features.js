const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        console.log("Starting Mega Feature Migration...");

        // 1. Feature: Bajaj/Ride Handoff - Add vehicle info to orders
        console.log("Adding vehicle info to orders...");
        await pool.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) DEFAULT 'private', 
            ADD COLUMN IF NOT EXISTS vehicle_plate VARCHAR(50);
        `);

        // 2. Feature: Landmark Navigation - Add landmark hints to branches/supermarkets
        // We'll add it to 'branches' table first as that's where location usually is
        console.log("Adding landmark_hint to branches...");
        await pool.query(`
            ALTER TABLE branches 
            ADD COLUMN IF NOT EXISTS landmark_hint TEXT;
        `);

        // 3. Feature: ID Verification - Add columns to customers
        console.log("Adding ID verification columns to customers...");
        await pool.query(`
            ALTER TABLE customers 
            ADD COLUMN IF NOT EXISTS is_age_verified BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS id_card_url TEXT;
        `);

        console.log("Migration Complete!");
        pool.end();
    } catch (err) {
        console.error("Migration Failed:", err);
        pool.end(); // Ensure we close pool even on error
    }
}

runMigration();
