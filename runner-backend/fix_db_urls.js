const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixBadUrls() {
    try {
        console.log("Fixing absolute URLs with old IP...");

        // 1. Fix Bundles
        // Assuming column is 'image_url' based on typical schema
        console.log("Updating Bundles...");
        const resBundles = await pool.query(`
            UPDATE bundles 
            SET image_url = REPLACE(image_url, 'http://192.168.1.5:5000/uploads/', '/uploads/') 
            WHERE image_url LIKE '%192.168.1.5%'
        `);
        console.log(`Updated ${resBundles.rowCount} bundles.`);

        // 2. Fix Products
        console.log("Updating Products...");
        const resProducts = await pool.query(`
            UPDATE products 
            SET image_url = REPLACE(image_url, 'http://192.168.1.5:5000/uploads/', '/uploads/') 
            WHERE image_url LIKE '%192.168.1.5%'
        `);
        console.log(`Updated ${resProducts.rowCount} products.`);

        // 3. Fix Ads (just in case they were added with full URL)
        console.log("Updating Ads...");
        const resAds = await pool.query(`
            UPDATE ads 
            SET media_url = REPLACE(media_url, 'http://192.168.1.5:5000/uploads/', '/uploads/') 
            WHERE media_url LIKE '%192.168.1.5%'
        `);
        console.log(`Updated ${resAds.rowCount} ads.`);

        pool.end();
    } catch (err) {
        console.error("Error during update:", err);
        pool.end();
    }
}

fixBadUrls();
