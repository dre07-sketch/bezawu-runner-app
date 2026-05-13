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
        console.log("STORIES TABLE:");
        const res1 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'stories'");
        res1.rows.forEach(r => console.log(r.column_name));

        console.log("\nBRANCHES TABLE:");
        const res2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'branches'");
        res2.rows.forEach(r => console.log(r.column_name));

        console.log("\nSUPERMARKETS TABLE:");
        const res3 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'supermarkets'");
        res3.rows.forEach(r => console.log(r.column_name));

        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}
checkSchema();
