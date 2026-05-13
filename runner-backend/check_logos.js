const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.query('SELECT name, logo FROM supermarkets', (err, res) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Supermarkets Logos:', res.rows);
    }
    pool.end();
});
