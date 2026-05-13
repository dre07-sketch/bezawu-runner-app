const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkAdsSchema() {
    try {
        // Check if 'ads' table exists and get its columns
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ads';
        `);

        if (res.rows.length === 0) {
            console.log("Table 'ads' does not exist.");
        } else {
            console.log("Ads Table Columns:");
            res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        }

        // Also fetch a few rows to see data sample
        if (res.rows.length > 0) {
            const dataRes = await pool.query('SELECT * FROM ads LIMIT 3');
            console.log("\nSample Data:");
            console.log(dataRes.rows);
        }

        pool.end();
    } catch (err) { console.error(err); pool.end(); }
}
checkAdsSchema();
