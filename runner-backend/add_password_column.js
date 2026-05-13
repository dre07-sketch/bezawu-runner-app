const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function addPasswordColumn() {
    try {
        await pool.query('ALTER TABLE customers ADD COLUMN password VARCHAR(255)');
        console.log('Successfully added password column!');
        pool.end();
    } catch (err) {
        console.error('Error adding column:', err.message);
        pool.end();
    }
}

addPasswordColumn();
