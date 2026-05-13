const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const fs = require('fs');

async function checkUrls() {
    try {
        let output = '--- Checking Product Image URLs ---\n';
        const res = await pool.query('SELECT id, name, image_url FROM products LIMIT 10');
        res.rows.forEach(r => {
            output += `[${r.id}] ${r.name}: ${r.image_url}\n`;
        });

        output += '\n--- Checking Bundles Image URLs ---\n';
        try {
            const bRes = await pool.query('SELECT id, name, image_url FROM bundles LIMIT 10');
            bRes.rows.forEach(r => {
                output += `[${r.id}] ${r.name}: ${r.image_url}\n`;
            });
        } catch (e) {
            output += 'Bundles table might not exist or error: ' + e.message + '\n';
        }

        fs.writeFileSync('dump.txt', output);
        console.log('Written to dump.txt');

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkUrls();
