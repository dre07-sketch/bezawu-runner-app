const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runhelper() {
    try {
        console.log("Dropping and recreating 'story_comments_and_likes' for proper schema...");

        await pool.query('DROP TABLE IF EXISTS story_comments_and_likes CASCADE');

        await pool.query(`
            CREATE TABLE story_comments_and_likes (
                id SERIAL PRIMARY KEY,
                story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
                user_id VARCHAR(255) REFERENCES customers(id) ON DELETE CASCADE,
                user_name VARCHAR(255),
                type VARCHAR(20) CHECK (type IN ('like', 'comment')),
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Table recreated successfully.");

        // Add indexes for performance
        await pool.query('CREATE INDEX idx_story_interactions_story_id ON story_comments_and_likes(story_id)');
        await pool.query('CREATE INDEX idx_story_interactions_user_id ON story_comments_and_likes(user_id)');

        pool.end();
    } catch (err) {
        console.error("Error:", err);
        pool.end();
    }
}

runhelper();
