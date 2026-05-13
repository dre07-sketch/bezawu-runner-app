const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function seed() {
    try {
        const client = await pool.connect();
        try {
            // Pick a product
            const res = await client.query('SELECT id FROM products LIMIT 1');
            if (res.rows.length > 0) {
                const pid = res.rows[0].id;
                await client.query('UPDATE products SET is_flash_deal = TRUE, flash_discount_percent = 20 WHERE id = $1', [pid]);
                console.log(`Updated Product ${pid} to be a Flash Deal (20% Off)`);
            } else {
                console.log('No products found to seed.');
            }
        } finally {
            client.release();
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

seed();
