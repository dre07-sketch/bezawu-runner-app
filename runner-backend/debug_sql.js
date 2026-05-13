const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function debug() {
    try {
        const client = await pool.connect();

        // Get an ID
        const res = await client.query('SELECT id FROM orders LIMIT 1');
        const id = res.rows[0].id;

        console.log(`Attempting to update handover_time for ${id}...`);

        try {
            await client.query("UPDATE orders SET handover_time = NOW() WHERE id = $1", [id]);
            console.log("SUCCESS! Column exists and is writable.");
        } catch (sqlErr) {
            console.error("SQL ERROR:", sqlErr.message);
        }

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
debug();
