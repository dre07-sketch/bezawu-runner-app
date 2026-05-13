const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkBranchesSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'branches';
        `);
        console.log("Branches Table Columns:");
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
checkBranchesSchema();
