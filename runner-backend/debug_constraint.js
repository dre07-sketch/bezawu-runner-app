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
        const res = await pool.query("SELECT check_clause FROM information_schema.check_constraints WHERE constraint_name = 'order_chats_sender_type_check'");
        if (res.rows.length > 0) {
            console.log("Check Clause:", res.rows[0].check_clause);
        }
        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
check();
