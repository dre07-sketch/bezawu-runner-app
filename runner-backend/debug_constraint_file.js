const { Pool } = require('pg');
const fs = require('fs');
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
        const res = await pool.query("SELECT pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname = 'order_chats_sender_type_check'");
        if (res.rows.length > 0) {
            fs.writeFileSync('constraint.txt', res.rows[0].def);
        } else {
            console.log("Constraint not found.");
        }
        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
check();
