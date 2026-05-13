const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('Connected to database...');

        // Add branch_id column without FK constraint first to avoid type mismatch issues
        console.log('Adding branch_id to feedback table...');
        try {
            await client.query(`
                ALTER TABLE feedback 
                ADD COLUMN IF NOT EXISTS branch_id VARCHAR(255),
                ADD COLUMN IF NOT EXISTS customer_id VARCHAR(255); 
            `);
            console.log('Columns added successfully (VARCHAR).');
        } catch (e) {
            console.log('Columns might already exist or error:', e.message);
        }

        client.release();
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
