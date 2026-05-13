const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkOrphans() {
    try {
        console.log("Checking products...");
        const res = await pool.query('SELECT p.name, p.category_id, c.name as cat_name FROM products p LEFT JOIN categories c ON p.category_id = c.id');
        res.rows.forEach(r => {
            console.log(`${r.name}: CatID=${r.category_id} -> ${r.cat_name ? r.cat_name : 'NULL (ORPHAN)'}`);
        });
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkOrphans();
