const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fetchVideos() {
    try {
        const res = await pool.query("SELECT id, title, video_url FROM stories");
        console.log("Stories Videos:");
        if (res.rows.length === 0) {
            console.log("No stories found.");
        } else {
            res.rows.forEach(r => console.log(r));
        }
        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
fetchVideos();
