const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log('Adding loyalty_points and profile_picture to customers table...');

        await client.query(`
            ALTER TABLE customers 
            ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS profile_picture TEXT
        `);

        console.log('Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
};

migrate();
