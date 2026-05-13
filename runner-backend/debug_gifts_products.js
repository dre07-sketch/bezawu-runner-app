const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkGifts() {
    try {
        const gifts = await pool.query('SELECT * FROM gifts LIMIT 5');
        console.log("\nGifts:");
        // console.table(gifts.rows);
        gifts.rows.forEach(r => console.log(JSON.stringify(r)));

        const products = await pool.query('SELECT * FROM products LIMIT 5');
        console.log("\nProducts:");
        // console.table(products.rows);
        products.rows.forEach(r => console.log(JSON.stringify(r)));

        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkGifts();
