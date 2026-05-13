require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        const client = await pool.connect();
        console.log('Adding car details columns...');

        await client.query(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS default_car_year INTEGER,
      ADD COLUMN IF NOT EXISTS default_car_image TEXT;
    `);

        console.log('Migration successful!');
        client.release();
        await pool.end();
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
