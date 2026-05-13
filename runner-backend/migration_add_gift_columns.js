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
        console.log("Adding gift columns to orders table...");

        await pool.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20),
            ADD COLUMN IF NOT EXISTS gift_message TEXT;
        `);

        console.log("Columns added successfully.");
        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
runMigration();
