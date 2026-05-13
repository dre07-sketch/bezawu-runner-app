const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bezaw',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function checkMoreCols() {
    try {
        // Check customers.default_car_image
        const cust = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'customers' AND column_name = 'default_car_image'
        `);
        console.log("Found customers.default_car_image:", cust.rows.length > 0);

        // Check orders.scheduled_pickup_time
        const ord1 = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'scheduled_pickup_time'
        `);
        console.log("Found orders.scheduled_pickup_time:", ord1.rows.length > 0);

        // Check orders.order_note
        const ord2 = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'orders' AND column_name = 'order_note'
        `);
        console.log("Found orders.order_note:", ord2.rows.length > 0);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkMoreCols();
