require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Starting seed...');
        await client.query('BEGIN');

        // 1. Clear existing data (optional, for clean slate)
        await client.query('TRUNCATE TABLE supermarkets, bank_accounts, branches, managers, categories, products, branch_inventory, customers, orders, feedback CASCADE');

        // 2. Create Supermarket
        const supermarketRes = await client.query(`
      INSERT INTO supermarkets (name, tin, reg_code, email) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id`,
            ['Shoa Supermarket', 'TIN001', 'REG001', 'shoa@example.com']
        );
        const supermarketId = supermarketRes.rows[0].id;
        console.log('Created Supermarket:', supermarketId);

        // 3. Create Branch
        const branchRes = await client.query(`
      INSERT INTO branches (supermarket_id, name, address, phone) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id`,
            [supermarketId, 'Bole Branch', 'Bole Road, Addis Ababa', '0911000000']
        );
        const branchId = branchRes.rows[0].id;
        console.log('Created Branch:', branchId);

        // 4. Create Manager (Password: 123456)
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('123456', salt);
        await client.query(`
      INSERT INTO managers (branch_id, name, email, password_hash, role) 
      VALUES ($1, $2, $3, $4, $5)`,
            [branchId, 'Kebede Manager', 'manager@shoa.com', hash, 'BRANCH_MANAGER']
        );
        console.log('Created Manager: manager@shoa.com / 123456');

        // 5. Create Categories
        const catGrains = await client.query(`INSERT INTO categories (supermarket_id, name) VALUES ($1, $2) RETURNING id`, [supermarketId, 'Grains']);
        const catBeverages = await client.query(`INSERT INTO categories (supermarket_id, name) VALUES ($1, $2) RETURNING id`, [supermarketId, 'Beverages']);
        const catVeg = await client.query(`INSERT INTO categories (supermarket_id, name) VALUES ($1, $2) RETURNING id`, [supermarketId, 'Vegetables']);

        // 6. Create Products
        const products = [
            { name: 'Teff Flour (5kg)', price: 450, catId: catGrains.rows[0].id, img: 'https://picsum.photos/id/42/300/300' },
            { name: 'Ethiopian Coffee Beans (1kg)', price: 350, catId: catBeverages.rows[0].id, img: 'https://picsum.photos/id/43/300/300' },
            { name: 'Red Onions (1kg)', price: 60, catId: catVeg.rows[0].id, img: 'https://picsum.photos/id/45/300/300' }
        ];

        for (const p of products) {
            const prodRes = await client.query(`
        INSERT INTO products (category_id, name, price, image_url) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id`,
                [p.catId, p.name, p.price, p.img]
            );

            // Add to inventory
            await client.query(`
        INSERT INTO branch_inventory (branch_id, product_id, stock_level) 
        VALUES ($1, $2, $3)`,
                [branchId, prodRes.rows[0].id, 100]
            );
        }
        console.log('Created Products and Inventory');

        // 7. Create Test Customer
        await client.query(`
      INSERT INTO customers (name, phone, email, password_hash) 
      VALUES ($1, $2, $3, $4)`,
            ['Abebe Bikila', '0911223344', 'abebe@example.com', hash]
        );
        console.log('Created Customer: Abebe Bikila');

        await client.query('COMMIT');
        console.log('Seeding Complete!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seeding Failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
