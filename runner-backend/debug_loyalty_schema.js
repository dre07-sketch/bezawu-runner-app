const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkSchema() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers'");
        console.log("Columns in customers table:");
        res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));

        const hasLoyalty = res.rows.some(r => r.column_name === 'loyalty_points');
        console.log(`\nHas loyalty_points column: ${hasLoyalty}`);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkSchema();
