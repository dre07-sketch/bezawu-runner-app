const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function listTables() {
    try {
        console.log("LIST OF TABLES:");
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        res.rows.forEach(r => console.log(r.table_name));
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}
listTables();
