const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function check() {
    try {
        const res = await pool.query("SELECT id, title, video_url FROM stories");
        console.log("Stories Data:");
        res.rows.forEach(r => console.log(r));
        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
check();
