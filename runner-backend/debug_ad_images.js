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

async function checkAdImages() {
    try {
        const res = await pool.query('SELECT * FROM ads WHERE is_active = true');
        console.log(`\nChecking images for ${res.rowCount} active ads...\n`);

        // Simulate server address (your local IP)
        const host = '192.168.1.3:5000';
        const baseUrl = `http://${host}/uploads/`;
        const uploadDir = path.join(__dirname, 'uploads');

        res.rows.forEach(ad => {
            console.log(`[Ad ID: ${ad.id}] Title: ${ad.title}`);

            let filename = ad.media_url;
            // Clean logic from routes/ads.js
            if (filename.startsWith('/')) filename = filename.substring(1);
            if (filename.startsWith('uploads/')) filename = filename.substring(8);

            const fullUrl = baseUrl + filename;
            const filePath = path.join(uploadDir, filename);
            const exists = fs.existsSync(filePath);

            console.log(`   - DB Value:  ${ad.media_url}`);
            console.log(`   - API URL:   ${fullUrl}`);
            console.log(`   - File Path: ${filePath}`);
            console.log(`   - Status:    ${exists ? '✅ FOUND' : '❌ MISSING'}`);
            console.log('---');
        });

        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

checkAdImages();
