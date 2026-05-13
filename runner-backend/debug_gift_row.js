const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkGiftsSchema() {
    try {
        const res = await pool.query("SELECT * FROM gifts LIMIT 1");
        console.log("Gift Row:", JSON.stringify(res.rows[0], null, 2));
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkGiftsSchema();
