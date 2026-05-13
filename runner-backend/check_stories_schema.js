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
        console.log("Checking for table 'story_comments_and_likes'...");
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'story_comments_and_likes';
        `);

        if (res.rows.length === 0) {
            console.log("Table 'story_comments_and_likes' does NOT exist. Creating it...");
            await pool.query(`
                CREATE TABLE story_comments_and_likes (
                    id SERIAL PRIMARY KEY,
                    story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
                    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
                    type VARCHAR(20) CHECK (type IN ('like', 'comment')),
                    comment_text TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log("Table created successfully.");
        } else {
            console.log("Table exists with columns:");
            res.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));
        }

        pool.end();
    } catch (err) {
        console.error("Error:", err);
        pool.end();
    }
}

checkSchema();
