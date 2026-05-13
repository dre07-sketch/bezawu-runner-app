const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testQuery() {
    try {
        const query = `
            SELECT s.*, 
            b.name as branch_name,
            sp.name as supermarket_name,
            sp.logo as supermarket_logo,
            (SELECT COUNT(*) FROM story_comments_and_likes WHERE story_id = s.id AND type = 'like') as real_likes_count,
            (SELECT COUNT(*) FROM story_comments_and_likes WHERE story_id = s.id AND type = 'comment') as real_comments_count
            FROM stories s
            LEFT JOIN branches b ON s.branch_id = b.id
            LEFT JOIN supermarkets sp ON (s.supermarket_id = sp.id OR b.supermarket_id = sp.id)
            WHERE s.is_active = true
            ORDER BY s.created_at DESC
        `;
        const res = await pool.query(query);
        console.log("Success! Rows:", res.rows.length);
        pool.end();
    } catch (err) {
        console.error("QUERY FAILED:");
        console.error(err);
        pool.end();
    }
}
testQuery();
