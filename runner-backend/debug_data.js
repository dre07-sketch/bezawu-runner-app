const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function inspect() {
    try {
        console.log('--- BRANCHES ---');
        const branches = await pool.query('SELECT id, name FROM branches');
        console.table(branches.rows);

        console.log('\n--- CUSTOMERS ---');
        const customers = await pool.query('SELECT id, name, phone FROM customers');
        console.table(customers.rows);

        if (customers.rows.length > 0) {
            const userId = customers.rows[0].id;
            console.log(`\n--- CART ITEMS for ${customers.rows[0].name} (${userId}) ---`);
            const cart = await pool.query(`
                SELECT c.product_id, c.quantity, p.name 
                FROM cart_items c 
                JOIN products p ON c.product_id = p.id 
                WHERE c.customer_id = $1`, [userId]);
            console.table(cart.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

inspect();
