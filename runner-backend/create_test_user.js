const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createTestUser() {
    const phone = '0912345678';
    const password = '123456';
    const fullName = 'Test User';

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const res = await pool.query(
            'INSERT INTO customers (full_name, phone, password) VALUES ($1, $2, $3) RETURNING *',
            [fullName, phone, hashedPassword]
        );
        console.log('Test user created successfully!');
        console.log('Phone:', res.rows[0].phone);
        console.log('Password:', password);
        pool.end();
    } catch (err) {
        console.error('Error creating user:', err);
        pool.end();
    }
}

createTestUser();
