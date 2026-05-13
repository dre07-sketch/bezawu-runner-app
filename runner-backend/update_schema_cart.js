const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    const client = await pool.connect();
    try {
        await client.query("ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS substitution_policy VARCHAR(20) DEFAULT 'best_match'");
        console.log("Added substitution_policy to cart_items");
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
