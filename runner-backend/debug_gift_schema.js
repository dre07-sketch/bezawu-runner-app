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
        console.log("Checking 'gifts' table...");
        const resGifts = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'gifts'");
        if (resGifts.rows.length === 0) console.log("Table 'gifts' does not exist.");
        else resGifts.rows.forEach(r => console.log(`gifts.${r.column_name}: ${r.data_type}`));

        console.log("\nChecking 'orders' table for gift columns...");
        const resOrders = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
        const columns = resOrders.rows.map(r => r.column_name);
        console.log("Has recipient_phone:", columns.includes('recipient_phone'));
        console.log("Has is_gift:", columns.includes('is_gift'));

        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
checkSchema();
