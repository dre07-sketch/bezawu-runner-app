const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkBranches() {
    try {
        const res = await pool.query('SELECT id, name, latitude, longitude FROM branches');
        console.log('Branches Coordinates:');
        res.rows.forEach(row => {
            console.log(`- ${row.name}: ${row.latitude}, ${row.longitude}`);
        });
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkBranches();
