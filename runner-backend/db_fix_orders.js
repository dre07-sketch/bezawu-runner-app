const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bezaw_grocery',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function run() {
    try {
        console.log("Adding scheduled_pickup_time column...");
        await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_pickup_time TIMESTAMP;');
        console.log("Success!");
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
