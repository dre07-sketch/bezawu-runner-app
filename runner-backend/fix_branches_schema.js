const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixBranches() {
    try {
        // Add latitude column
        await pool.query('ALTER TABLE branches ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8)');
        console.log('Added latitude column.');

        // Backfill data
        await pool.query('UPDATE branches SET latitude = 9.005401 WHERE latitude IS NULL');
        console.log('Backfilled latitude data.');

        pool.end();
    } catch (err) {
        console.error('Error fixing branches:', err);
        pool.end();
    }
}

fixBranches();
