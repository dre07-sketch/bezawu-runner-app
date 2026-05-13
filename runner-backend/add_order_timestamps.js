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

        console.log('Adding timestamp columns to orders table...');
        await client.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS handover_time TIMESTAMP WITH TIME ZONE;
        `);
        console.log('Columns added successfully.');

        client.release();
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
