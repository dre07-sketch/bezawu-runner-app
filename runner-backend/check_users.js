const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkUsers() {
    try {
        const res = await pool.query('SELECT * FROM customers');
        console.log('Total customers:', res.rowCount);
        res.rows.forEach(row => {
            console.log(`- Phone: ${row.phone}, Name: ${row.full_name}`);
        });
        pool.end();
    } catch (err) {
        console.error('Error querying customers:', err);
        pool.end();
    }
}

checkUsers();
