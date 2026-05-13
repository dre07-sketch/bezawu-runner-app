require('dotenv').config();
const { Client } = require('pg');

const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres', // Connect to default DB to create the new one
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
};

async function init() {
    const client = new Client(config);
    try {
        await client.connect();
        // Check if db exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'bezawdb'");
        if (res.rows.length === 0) {
            console.log('Creating database "bezawdb"...');
            await client.query('CREATE DATABASE bezawdb');
            console.log('Database created!');
        } else {
            console.log('Database "bezawdb" already exists.');
        }
    } catch (err) {
        console.error('Error during DB init:', err);
    } finally {
        await client.end();
    }
}

init();
