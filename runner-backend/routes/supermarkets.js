const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Get nearby supermarket branches
router.get('/nearby', async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude and Longitude required' });
    }

    try {
        const client = await pool.connect();
        const query = `
            SELECT 
                b.id,
                b.name as branch_name,
                s.name as vendor_name,
                s.logo as logo_url,
                s.image as image_url,
                b.address,
                b.latitude,
                b.longitude,
                b.status,
                b.is_busy,
                (
                    6371 * acos(
                        cos(radians($1)) * cos(radians(b.latitude)) *
                        cos(radians(b.longitude) - radians($2)) +
                        sin(radians($1)) * sin(radians(b.latitude))
                    )
                ) AS distance_km
            FROM branches b
            JOIN vendors s ON b.vendor_id = s.id
            ORDER BY distance_km ASC
            LIMIT 10;
        `;
        const result = await client.query(query, [lat, lng]);
        client.release();

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching nearby branches' });
    }
});

// Get all supermarkets with branches
router.get('/', async (req, res) => {
    try {
        const client = await pool.connect();
        const query = `
            SELECT s.*, 
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', b.id,
                               'name', b.name,
                               'latitude', b.latitude,
                               'longitude', b.longitude,
                               'map_pin', b.map_pin,
                               'status', b.status,
                               'is_busy', b.is_busy,
                               'phone', b.phone,
                               'address', b.address
                           )
                       ) FILTER (WHERE b.id IS NOT NULL), 
                       '[]'
                   ) as branches
            FROM vendors s
            LEFT JOIN branches b ON s.id = b.vendor_id
            GROUP BY s.id
        `;
        const result = await client.query(query);
        client.release();

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching supermarkets' });
    }
});

module.exports = router;
