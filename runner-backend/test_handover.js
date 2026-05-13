const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testEndpoint() {
    try {
        // 1. Get an order
        const client = await pool.connect();
        const res = await client.query("SELECT id FROM orders LIMIT 1");
        client.release();

        if (res.rows.length === 0) {
            console.log('No orders to test.');
            return;
        }

        const orderId = res.rows[0].id;
        console.log(`Testing Handover for Order: ${orderId}`);

        // 2. Call API
        try {
            const apiRes = await axios.put(`http://192.168.1.3:5000/api/orders/employee-view/${orderId}/status`, {
                status: 'COMPLETED'
            });
            console.log('Status Code:', apiRes.status);
            console.log('Response Data:', apiRes.data);
        } catch (apiErr) {
            console.log('API Error:', apiErr.message);
            if (apiErr.response) {
                console.log('Response:', apiErr.response.data);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

testEndpoint();
