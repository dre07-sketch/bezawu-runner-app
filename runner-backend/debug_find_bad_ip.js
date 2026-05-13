const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function searchBadIP() {
    try {
        console.log("Searching for '192.168.1.5' in key tables...");

        const tables = ['ads', 'products', 'bundles', 'users', 'categories']; // Common tables with images

        for (const table of tables) {
            // Check if table exists first (optional, but good practice if unsure)
            // For now, assuming they exist based on context
            try {
                // simple loop to check text columns. Adjust columns as needed.
                // We'll just check 'image_url' or 'media_url' if they exist, or generalized query.
                // Postgres allows checking whole row text representationcast
                const query = `SELECT * FROM ${table} WHERE CAST(ROW_TO_JSON(${table}) AS TEXT) LIKE '%192.168.1.5%'`;
                const res = await pool.query(query);
                if (res.rowCount > 0) {
                    console.log(`\nFound matches in table '${table}':`);
                    console.log(JSON.stringify(res.rows, null, 2));
                }
            } catch (ignored) {
                // Table might not exist or verify later
            }
        }

        console.log("\nSearch complete.");
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

searchBadIP();
