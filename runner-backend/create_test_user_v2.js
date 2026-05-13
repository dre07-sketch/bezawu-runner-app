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
    const name = 'Test User';
    const email = 'test@example.com'; // Adding dummy email

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Corrected columns: name (not full_name), added email
        const res = await pool.query(
            'INSERT INTO customers (name, phone, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, phone, email, hashedPassword]
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
