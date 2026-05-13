const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkInventory() {
    try {
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'inventory'
        `);
        console.log('Inventory table exists:', res.rowCount > 0);

        if (res.rowCount > 0) {
            const schema = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'inventory'
            `);
            console.log('Columns:');
            schema.rows.forEach(r => console.log(`- ${r.column_name}`));
        }
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkInventory();
