const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products';
        `);
        console.log("Columns:", res.rows.map(r => r.column_name));
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkSchema();
