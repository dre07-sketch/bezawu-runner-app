const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function activateAds() {
    try {
        await pool.query('UPDATE ads SET is_active = true');
        console.log('All ads set to active.');
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

activateAds();
