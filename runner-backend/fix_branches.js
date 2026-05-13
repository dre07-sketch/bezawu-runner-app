const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function fixBranches() {
    try {
        const client = await pool.connect();

        console.log('Updating branches with missing location data...');

        // 1. Update Bole Branch (example ID or name check, but let's do safe defaults for now)
        // Set default location for ANY branch missing lat/lng to Bole, Addis Ababa
        const res = await client.query(`
            UPDATE branches 
            SET 
                latitude = 9.005401,
                longitude = 38.763611,
                map_pin = 'https://goo.gl/maps/bole'
            WHERE latitude IS NULL OR longitude IS NULL OR map_pin IS NULL
        `);

        console.log(`Updated ${res.rowCount} branches.`);

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Error updating branches:', err);
        process.exit(1);
    }
}

fixBranches();
