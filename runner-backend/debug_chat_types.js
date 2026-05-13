const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function check() {
    try {
        const res = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'order_chats'");
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type} (Null: ${r.is_nullable})`));
        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
check();
