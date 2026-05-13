const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'story_comments_and_likes';
        `);
        console.log("COLUMNS:");
        res.rows.forEach(r => console.log(`${r.column_name}`));
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}
checkSchema();
