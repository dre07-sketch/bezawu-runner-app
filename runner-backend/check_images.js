const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkBrokenImages() {
    try {
        const uploadDir = path.join(__dirname, 'uploads');
        const files = fs.readdirSync(uploadDir);
        console.log(`\nFiles in uploads (${files.length}):`, files);

        const bundles = await pool.query('SELECT id, name, image_url FROM bundles');
        const products = await pool.query('SELECT id, name, image_url FROM products');

        console.log('\n--- Checking Bundles ---');
        bundles.rows.forEach(row => {
            if (row.image_url && row.image_url.includes('/uploads/')) {
                const filename = row.image_url.split('/').pop();
                if (!files.includes(filename)) {
                    console.log(`[MISSING] Bundle '${row.name}' (ID: ${row.id}): ${filename}`);
                }
            }
        });

        console.log('\n--- Checking Products ---');
        products.rows.forEach(row => {
            if (row.image_url && row.image_url.includes('/uploads/')) {
                const filename = row.image_url.split('/').pop();
                if (row.name === 'birthday') {
                    console.log(`Checking 'birthday': DB Filename '${filename}' vs Files:`, files);
                }
                if (!files.includes(filename)) {
                    console.log(`[MISSING] Product '${row.name}' (ID: ${row.id}): ${filename}`);
                }
            }
        });

        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkBrokenImages();
