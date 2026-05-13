const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkOrphansReal() {
    try {
        const res = await pool.query(`
            SELECT p.name, p.category_id 
            FROM products p 
            WHERE p.category_id NOT IN (SELECT id FROM categories)
        `);
        console.log(`Orphan Products: ${res.rows.length}`);
        res.rows.forEach(r => console.log(`${r.name}: ${r.category_id}`));
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkOrphansReal();
