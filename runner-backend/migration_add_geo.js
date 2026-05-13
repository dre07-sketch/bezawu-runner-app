require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    try {
        const client = await pool.connect();
        console.log('Running Geo Migration...');

        // 1. Add Columns
        await client.query("ALTER TABLE branches ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION");
        await client.query("ALTER TABLE branches ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION");
        console.log("Columns added to branches table.");

        // 2. Seed Mock Data for known branches (fuzzy match)
        // Shoa Bole
        await client.query("UPDATE branches SET latitude = 9.005401, longitude = 38.763611 WHERE name ILIKE '%Bole%' OR address ILIKE '%Bole%'");
        // Shoa Piassa / Arada
        await client.query("UPDATE branches SET latitude = 9.035000, longitude = 38.750000 WHERE name ILIKE '%Piassa%' OR address ILIKE '%Piassa%'");
        // Megenagna
        await client.query("UPDATE branches SET latitude = 9.020000, longitude = 38.800000 WHERE name ILIKE '%Megenagna%' OR address ILIKE '%Megenagna%'");
        // Sarbet
        await client.query("UPDATE branches SET latitude = 8.990000, longitude = 38.730000 WHERE name ILIKE '%Sarbet%' OR address ILIKE '%Sarbet%'");
        // Friendship (Mall)
        await client.query("UPDATE branches SET latitude = 8.995000, longitude = 38.785000 WHERE name ILIKE '%Friendship%' OR address ILIKE '%Friendship%'");
        // Generic fill for others to avoid nulls (center of addis)
        await client.query("UPDATE branches SET latitude = 9.000000, longitude = 38.750000 WHERE latitude IS NULL");

        console.log("Geo data seeded.");

        client.release();
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
