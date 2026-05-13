const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createAndSeedInventory() {
    try {
        console.log("Creating inventory table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                product_id VARCHAR(255) REFERENCES products(id) ON DELETE CASCADE,
                branch_id VARCHAR(255) REFERENCES branches(id) ON DELETE CASCADE,
                quantity INTEGER DEFAULT 100,
                price DECIMAL(10,2), 
                UNIQUE(product_id, branch_id)
            );
        `);

        console.log("Seeding inventory data...");
        const products = await pool.query('SELECT id FROM products');
        const branches = await pool.query('SELECT id FROM branches');

        if (products.rows.length === 0) {
            console.log("No products found! Please seed products first.");
        } else if (branches.rows.length === 0) {
            console.log("No branches found!");
        } else {
            console.log(`Found ${products.rowCount} products and ${branches.rowCount} branches.`);
            for (const branch of branches.rows) {
                for (const product of products.rows) {
                    await pool.query(`
                        INSERT INTO inventory (product_id, branch_id, quantity)
                        VALUES ($1, $2, 50)
                        ON CONFLICT (product_id, branch_id) DO NOTHING
                    `, [product.id, branch.id]);
                }
            }
            console.log("Inventory seeded successfully!");
        }
        pool.end();
    } catch (err) {
        console.error('Error:', err);
        pool.end();
    }
}

createAndSeedInventory();
