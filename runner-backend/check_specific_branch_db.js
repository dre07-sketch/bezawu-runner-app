const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkSpecificBranch() {
    try {
        const id = 'BZWB-388637';
        console.log(`Checking inventory for: ${id}`);

        // Check inventory count
        const invRes = await pool.query(`
            SELECT i.product_id, i.quantity, p.name 
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            WHERE i.branch_id = $1
        `, [id]);

        console.log(`Found ${invRes.rows.length} items in inventory.`);
        invRes.rows.forEach(r => console.log(`- ${r.name} (Qty: ${r.quantity})`));

        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkSpecificBranch();
