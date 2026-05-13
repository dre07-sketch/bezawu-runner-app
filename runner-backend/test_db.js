require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log(`Successfully connected to database: ${process.env.DB_NAME}`);
    
    const res = await client.query('SELECT NOW()');
    console.log('Database time:', res.rows[0].now);
    
    // Check if tables exist (optional, just to see if it's empty)
    const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);
    
    console.log('Existing tables:', tables.rows.map(row => row.table_name));

    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection error', err.stack);
    process.exit(1);
  }
}

testConnection();
