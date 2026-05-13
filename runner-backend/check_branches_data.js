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
        const res = await pool.query('SELECT name, map_pin, latitude, longitude FROM branches');
        console.log('Branches Data:');
        res.rows.forEach(row => {
            console.log(`- ${row.name}`);
            console.log(`  Map Pin: ${JSON.stringify(row.map_pin)}`);
            console.log(`  Lat: ${row.latitude}, Lng: ${row.longitude}`);
        });
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkBranches();
