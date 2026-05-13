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

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'feedback';
        `);

        console.log('Columns in feedback table:');
        res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

check();
