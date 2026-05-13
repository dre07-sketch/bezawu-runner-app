const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixColumnName() {
    try {
        // Renaming 'password' to 'password_hash' to match auth.js logic
        await pool.query('ALTER TABLE customers RENAME COLUMN password TO password_hash');
        console.log('Successfully renamed column password to password_hash!');
        pool.end();
    } catch (err) {
        console.error('Error renaming column:', err.message);
        pool.end();
    }
}

fixColumnName();
