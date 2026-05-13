const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateAdImages() {
    try {
        console.log("Updating Ad Images (media_url only)...");

        const res = await pool.query('SELECT id FROM ads ORDER BY id');
        const ids = res.rows.map(row => row.id);

        if (ids.length >= 1) {
            await pool.query('UPDATE ads SET media_url = $1 WHERE id = $2',
                ['/uploads/ad_promo_1.png', ids[0]]);
            console.log(`Updated Ad ${ids[0]} -> ad_promo_1.png`);
        }

        if (ids.length >= 2) {
            await pool.query('UPDATE ads SET media_url = $1 WHERE id = $2',
                ['/uploads/ad_promo_2.png', ids[1]]);
            console.log(`Updated Ad ${ids[1]} -> ad_promo_2.png`);
        }

        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

updateAdImages();
