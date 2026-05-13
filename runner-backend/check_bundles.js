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

        console.log('--- ALL BUNDLES ---');
        const res = await client.query(`
            SELECT b.id, b.name, b.branch_id, br.name as branch_name 
            FROM bundles b
            LEFT JOIN branches br ON b.branch_id = br.id
        `);
        console.table(res.rows);

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

check();
