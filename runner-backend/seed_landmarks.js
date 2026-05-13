const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function seedLandmarks() {
    try {
        console.log("Seeding Landmark Hints...");

        // Update a few branches with realistic Addis landmarks
        await pool.query(`
            UPDATE branches 
            SET landmark_hint = 'Pass the Commercial Bank, turn right at the Total station. Look for the yellow gate.'
            WHERE id IN (SELECT id FROM branches LIMIT 1)
        `);

        // Check update
        const res = await pool.query('SELECT name, landmark_hint FROM branches LIMIT 1');
        console.log("Updated Branch:", res.rows[0]);

        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

seedLandmarks();
