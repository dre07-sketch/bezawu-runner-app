const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateSchema() {
    try {
        const client = await pool.connect();
        try {
            console.log('Starting Schema Update for New Features...');

            // 1. Family Groups
            try {
                await client.query(`
                    CREATE TABLE IF NOT EXISTS family_groups (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        name VARCHAR(255),
                        code VARCHAR(10) UNIQUE, -- Invite Code
                        created_at TIMESTAMP DEFAULT NOW()
                    );
                `);
                console.log('Family Groups Table Done');
            } catch (e) { console.error('Family Groups Error:', e.message); }


            // 2. Update Customers (Groups, Wallet, Allergies)
            try {
                await client.query(`
                    ALTER TABLE customers 
                    ADD COLUMN IF NOT EXISTS family_group_id UUID REFERENCES family_groups(id),
                    ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00,
                    ADD COLUMN IF NOT EXISTS allergies TEXT; 
                `);
                console.log('Customers Columns Done');
            } catch (e) { console.error('Customers Error:', e.message); }

            // 3. Update Products
            console.log('Updating Products...');
            try {
                await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_flash_deal BOOLEAN DEFAULT FALSE`);
                console.log(' - is_flash_deal Added');
            } catch (e) { console.error(' - is_flash_deal Error:', e.message); }

            try {
                await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS flash_discount_percent INT DEFAULT 0`);
                console.log(' - flash_discount_percent Added');
            } catch (e) { console.error(' - flash_discount_percent Error:', e.message); }

            try {
                await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS allergens TEXT`);
                console.log(' - allergens Added');
            } catch (e) { console.error(' - allergens Error:', e.message); }

            try {
                // Try without FK constraint first if it fails
                await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS substitute_product_id INT`);
                console.log(' - substitute_product_id Added');
            } catch (e) { console.error(' - substitute_product_id Error:', e.message); }

            // 4. Chat Messages
            try {
                await client.query(`
                    CREATE TABLE IF NOT EXISTS messages (
                        id SERIAL PRIMARY KEY,
                        order_id INT REFERENCES orders(id),
                        sender_id INT REFERENCES customers(id), -- Or Manager ID? Assuming Customer for now
                        is_from_driver BOOLEAN DEFAULT FALSE,
                        message TEXT,
                        created_at TIMESTAMP DEFAULT NOW()
                    );
                `);
                console.log('Messages Table Done');
            } catch (e) { console.error('Messages Error:', e.message); }

            // 5. Stock Alerts
            try {
                await client.query(`
                    CREATE TABLE IF NOT EXISTS stock_alerts (
                        id SERIAL PRIMARY KEY,
                        customer_id INT REFERENCES customers(id),
                        product_id INT REFERENCES products(id),
                        created_at TIMESTAMP DEFAULT NOW()
                    );
                `);
                console.log('Stock Alerts Table Done');
            } catch (e) { console.error('Stock Alerts Error:', e.message); }

            console.log('Schema Update Attempt Finished');

        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Connection Error:', err);
    } finally {
        await pool.end();
    }
}

updateSchema();
