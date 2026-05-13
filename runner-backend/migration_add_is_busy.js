const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        console.log("Checking for 'is_busy' column in 'branches' table...");
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'branches' AND column_name = 'is_busy';
        `);

        if (res.rows.length === 0) {
            console.log("Adding 'is_busy' column...");
            await pool.query("ALTER TABLE branches ADD COLUMN is_busy BOOLEAN DEFAULT FALSE;");
            console.log("Column added.");
        } else {
            console.log("'is_busy' column already exists.");
        }

        // Mark one random branch as busy for testing
        await pool.query("UPDATE branches SET is_busy = true WHERE id = (SELECT id FROM branches LIMIT 1)");
        console.log("Marked one branch as busy for testing.");

        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
runMigration();
