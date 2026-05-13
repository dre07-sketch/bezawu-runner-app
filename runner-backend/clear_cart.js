require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function clearCart() {
    const client = await pool.connect();
    try {
        console.log('Clearing cart items...');
        await client.query('DELETE FROM cart_items');
        console.log('Cart cleared successfully.');
    } catch (e) {
        console.error('Error clearing cart:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

clearCart();
