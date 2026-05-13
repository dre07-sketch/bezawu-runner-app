const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateStories() {
    try {
        const sampleVideo = 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4';

        // 1. Update Video URL
        await pool.query("UPDATE stories SET video_url = $1", [sampleVideo]);
        console.log("Updated stories video_url to sample.");

        // 2. Check branch_id
        const res = await pool.query("SELECT id, branch_id FROM stories");
        console.log("Stories Branches:", res.rows);

        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
updateStories();
