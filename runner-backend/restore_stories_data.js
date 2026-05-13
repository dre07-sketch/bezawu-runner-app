const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function revendorstories() {
    try {
        // Restore to the relative path of the video we found earlier
        // This assumes this video exists on the 'other pc' (192.168.1.3)
        const originalVideoPath = '/uploads/bundle-1767969549391-317717707.mp4';

        await pool.query("UPDATE stories SET video_url = $1", [originalVideoPath]);
        console.log("Restored stories video_url to relative path:", originalVideoPath);

        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
revendorstories();
