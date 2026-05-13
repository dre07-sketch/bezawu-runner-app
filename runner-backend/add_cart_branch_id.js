const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function addBranchIdToCart() {
    try {
        await pool.query('ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS branch_id VARCHAR(255) REFERENCES branches(id) ON DELETE CASCADE');
        console.log("Added branch_id to cart_items");
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

addBranchIdToCart();
