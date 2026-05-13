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
        console.log("Checking for columns in 'orders' table...");

        // Check if columns exist
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name IN ('arrived_at', 'completed_at', 'handover_time');
        `);

        const existingColumns = res.rows.map(r => r.column_name);
        console.log("Existing columns:", existingColumns);

        const queries = [];

        if (!existingColumns.includes('arrived_at')) {
            queries.push("ALTER TABLE orders ADD COLUMN arrived_at TIMESTAMP;");
            console.log("Adding arrived_at...");
        }

        if (!existingColumns.includes('completed_at')) {
            queries.push("ALTER TABLE orders ADD COLUMN completed_at TIMESTAMP;");
            console.log("Adding completed_at...");
        }

        if (!existingColumns.includes('handover_time')) {
            queries.push("ALTER TABLE orders ADD COLUMN handover_time INTERVAL;");
            console.log("Adding handover_time...");
        }

        for (const q of queries) {
            await pool.query(q);
        }

        console.log("Migration complete.");
        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
runMigration();
