const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrateGifts() {
    try {
        console.log("Starting Gift Migration...");

        // 1. Get or Create 'Gifts' Category
        let catRes = await pool.query("SELECT id FROM categories WHERE name = 'Gifts'");
        let catId;
        if (catRes.rows.length === 0) {
            console.log("Creating Gifts category...");
            catRes = await pool.query("INSERT INTO categories (name) VALUES ('Gifts') RETURNING id");
            catId = catRes.rows[0].id;
        } else {
            catId = catRes.rows[0].id;
        }
        console.log("Category ID:", catId);

        // 2. Fetch existing specific 'gifts' table items
        // Check if table exists first (it does, per previous steps)
        const giftItems = await pool.query("SELECT * FROM gifts");

        for (const gift of giftItems.rows) {
            console.log(`Migrating gift: ${gift.name}`);

            // Insert into products
            // Generate distinct ID
            const newId = `BZWP-GIFT-${gift.id}`;

            // Check if already exists to avoid dup
            const check = await pool.query("SELECT id FROM products WHERE name = $1 AND category_id = $2", [gift.name, catId]);
            if (check.rows.length === 0) {
                await pool.query(
                    `INSERT INTO products (id, name, description, price, category_id, stock_quantity, image_url)
                     VALUES ($1, $2, $3, $4, $5, 999, $6)`,
                    [newId, gift.name, gift.description || '', gift.price, catId, gift.image_url]
                );
                console.log("Inserted.");
            } else {
                console.log("Already exists, skipping.");
            }
        }

        console.log("Migration Done.");
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

migrateGifts();
