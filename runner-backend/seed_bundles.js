require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function seedBundles() {
    const client = await pool.connect();
    try {
        console.log('Seeding bundles...');
        await client.query('DELETE FROM bundles'); // Clear old bundles


        // 1. Get existing products to link
        const productRes = await client.query('SELECT id, name, price FROM products LIMIT 10');
        const products = productRes.rows;

        if (products.length < 2) {
            console.log('Not enough products to create bundles. Please seed products first.');
            return;
        }

        console.log(`Found ${products.length} products to use.`);

        // Get a branch ID
        const branchRes = await client.query('SELECT id FROM branches LIMIT 1');
        if (branchRes.rows.length === 0) {
            console.log('No branches found. Please seed branches first.');
            return;
        }
        const branchId = branchRes.rows[0].id;


        // 2. Create Bundles
        // Bundle 1: Family Essentials
        const bundle1Res = await client.query(`
            INSERT INTO bundles (name, description, price, image_url, is_active, branch_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [
            'Family Essentials Pack',
            'All your weekly kitchen needs in one go. Includes onions, beans, and more.',
            1500.00, // Arbitrary price
            'https://media.istockphoto.com/id/1205419959/photo/fresh-vegetables-in-eco-cotton-bags-on-table-in-the-kitchen.jpg?s=612x612&w=0&k=20&c=JdF6R4W5o6fW6_3J8z5X_7_4d9_4_8_2_5_8',
            true,
            branchId
        ]);
        const bundle1Id = bundle1Res.rows[0].id;

        // Bundle 2: Breakfast Special
        const bundle2Res = await client.query(`
            INSERT INTO bundles (name, description, price, image_url, is_active, branch_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [
            'Breakfast Special',
            'Start your day right with these healthy options.',
            850.50,
            'https://t3.ftcdn.net/jpg/02/52/38/80/360_F_252388016_KjPnB9dlgPDqjFjKqjFjKqjFjKqjFjKq.jpg',
            true,
            branchId
        ]);
        const bundle2Id = bundle2Res.rows[0].id;

        console.log(`Created Bundle 1: ${bundle1Id}`);
        console.log(`Created Bundle 2: ${bundle2Id}`);

        // 3. Add Items to Bundles
        // Add random available products to bundles

        // Add first 2 products to Bundle 1
        await client.query(`
            INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES ($1, $2, $3)
        `, [bundle1Id, products[0].id, 2]); // 2 of first product

        if (products[1]) {
            await client.query(`
                INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES ($1, $2, $3)
            `, [bundle1Id, products[1].id, 1]); // 1 of second product
        }

        // Add 3rd product (or 1st again) to Bundle 2
        const p3 = products[2] || products[0];
        await client.query(`
            INSERT INTO bundle_items (bundle_id, product_id, quantity) VALUES ($1, $2, $3)
        `, [bundle2Id, p3.id, 5]);

        console.log('Bundle items added successfully!');

    } catch (err) {
        console.error('Error seeding bundles:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seedBundles();
