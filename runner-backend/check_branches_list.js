const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkBranches() {
    try {
        const res = await pool.query('SELECT id, name, supermarket_id FROM branches');
        res.rows.forEach(r => {
            console.log(`${r.name}: ${r.id}`);
        });
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkBranches();
