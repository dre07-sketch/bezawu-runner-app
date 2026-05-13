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

        console.log('Dropping sentiment column from feedback table...');
        try {
            await client.query(`
                ALTER TABLE feedback 
                DROP COLUMN IF EXISTS sentiment;
            `);
            console.log('Column dropped successfully.');
        } catch (e) {
            console.log('Error dropping column:', e.message);
        }

        client.release();
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
