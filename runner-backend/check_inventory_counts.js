const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkInventoryCounts() {
    try {
        console.log("Checking inventory counts per branch...");
        const res = await pool.query(`
            SELECT b.name, b.id, COUNT(i.product_id) as product_count 
            FROM branches b
            LEFT JOIN inventory i ON b.id = i.branch_id
            GROUP BY b.id, b.name
            ORDER BY product_count ASC
        `);

        res.rows.slice(0, 5).forEach(r => {
            console.log(`Branch: ${r.name} (${r.id}) - Count: ${r.product_count}`);
        });
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkInventoryCounts();
