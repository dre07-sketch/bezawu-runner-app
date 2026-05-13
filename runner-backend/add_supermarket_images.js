const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    try {
        const client = await pool.connect();

        // 1. Add image column if not exists
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'supermarkets' AND column_name = 'image') THEN 
                    ALTER TABLE supermarkets ADD COLUMN image TEXT; 
                END IF; 
            END $$;
        `);
        console.log("Added image column.");

        // 2. Populate with sample images for ALL supermarkets
        const images = [
            'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=1000'
        ];

        const resIds = await client.query('SELECT id FROM supermarkets');
        for (let i = 0; i < resIds.rows.length; i++) {
            const id = resIds.rows[i].id;
            const img = images[i % images.length];
            await client.query('UPDATE supermarkets SET image = $1 WHERE id = $2', [img, id]);
        }

        // Access (Query to check)
        const res = await client.query('SELECT name, image FROM supermarkets');
        console.log("Updated Supermarkets:", res.rows);

        client.release();
    } catch (e) {
        console.error("Error:", e);
    } finally {
        pool.end();
    }
}

run();
