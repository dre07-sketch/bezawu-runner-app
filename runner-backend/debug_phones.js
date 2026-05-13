const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkPhones() {
    try {
        const users = await pool.query('SELECT id, name, phone FROM customers');
        console.log("\n--- CUSTOMERS ---");
        users.rows.forEach(r => console.log(`${r.name}: ${r.phone}`));

        const gifts = await pool.query("SELECT id, recipient_phone, is_gift FROM orders WHERE is_gift = true");
        console.log("\n--- GIFT ORDERS ---");
        gifts.rows.forEach(r => console.log(`Order ${r.id}: Recipient ${r.recipient_phone}`));

        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkPhones();
