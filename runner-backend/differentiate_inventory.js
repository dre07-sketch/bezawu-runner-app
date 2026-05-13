const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function differentiate() {
    try {
        console.log("Clearing current inventory...");
        await pool.query('TRUNCATE TABLE inventory');

        const products = await pool.query('SELECT id, name FROM products');
        const branches = await pool.query('SELECT id, name FROM branches');

        console.log(`Distributing ${products.rowCount} products across ${branches.rowCount} branches randomly...`);

        for (const branch of branches.rows) {
            let count = 0;
            for (const product of products.rows) {
                // 50% chance to have a product
                if (Math.random() > 0.5) {
                    await pool.query(`
                        INSERT INTO inventory (product_id, branch_id, quantity)
                        VALUES ($1, $2, ${Math.floor(Math.random() * 50) + 1})
                    `, [product.id, branch.id]);
                    count++;
                }
            }
            console.log(`- Branch '${branch.name}' gets ${count} products.`);
        }
        console.log("Differentiation complete.");
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

differentiate();
