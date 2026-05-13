const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function dumpPins() {
    try {
        const res = await pool.query('SELECT name, map_pin FROM branches');
        let output = '';
        res.rows.forEach(row => {
            output += `Branch: ${row.name}\nURL: ${row.map_pin}\n\n`;
        });
        fs.writeFileSync('map_pins_dump.txt', output);
        console.log('Dumped to map_pins_dump.txt');
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

dumpPins();
