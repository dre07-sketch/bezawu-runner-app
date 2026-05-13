const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkProductsBranch() {
    try {
        const id = 'BZWB-388637';
        console.log(`Checking PRODUCTS table for branch_id: ${id}`);

        const res = await pool.query(`
            SELECT name, id, branch_id 
            FROM products 
            WHERE branch_id = $1
        `, [id]);

        console.log(`Found ${res.rows.length} products.`);
        res.rows.forEach(r => console.log(`- ${r.name}`));

        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkProductsBranch();
