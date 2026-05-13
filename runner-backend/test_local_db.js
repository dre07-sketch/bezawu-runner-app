const { Pool } = require('pg');
require('dotenv').config();

// Override host to localhost for this test
const pool = new Pool({
    user: process.env.DB_USER,
    host: 'localhost',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testConnection() {
    console.log(`Attempting to connect to localhost:${process.env.DB_PORT}...`);
    try {
        const client = await pool.connect();
        console.log('Successfully connected to LOCAL database!');
        const res = await client.query('SELECT NOW()');
        console.log('Database time:', res.rows[0].now);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Connection to LOCALHOST failed:', err.message);
        process.exit(1);
    }
}

testConnection();
