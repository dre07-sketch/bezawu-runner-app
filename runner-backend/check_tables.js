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
        const client = await pool.connect();

        console.log('--- branches ---');
        const resBranches = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'branches'");
        resBranches.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

        console.log('--- feedback ---');
        const resFeedback = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'feedback'");
        resFeedback.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

check();
