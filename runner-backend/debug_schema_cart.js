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
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'cart_items'");
        console.log("Cart Items Columns:", res.rows.map(r => r.column_name));

        const res2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'customers'");
        console.log("Customers Columns:", res2.rows.map(r => r.column_name));

        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkSchema();
