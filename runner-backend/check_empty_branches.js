const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkEmpty() {
    try {
        const res = await pool.query(`
            SELECT b.name, b.id, COUNT(i.product_id) as product_count 
            FROM branches b
            LEFT JOIN inventory i ON b.id = i.branch_id
            GROUP BY b.id, b.name
            HAVING COUNT(i.product_id) = 0
        `);

        console.log(`Branches with 0 items: ${res.rows.length}`);
        res.rows.forEach(r => {
            console.log(`Branch: ${r.name}`);
        });
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkEmpty();
