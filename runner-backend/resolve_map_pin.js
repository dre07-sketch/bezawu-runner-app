require('dotenv').config();
const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

function resolveUrl(url) {
    return new Promise((resolve, reject) => {
        if (!url.startsWith('http')) {
            return resolve(url);
        }
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve(res.headers.location);
            } else {
                resolve(url); // No redirect or final URL
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function getLocations() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, name, map_pin FROM branches WHERE map_pin IS NOT NULL');
        for (const row of res.rows) {
            console.log(`Processing branch: ${row.name}, Pin: ${row.map_pin}`);
            try {
                const finalUrl = await resolveUrl(row.map_pin);
                console.log(`  -> Resolved URL: ${finalUrl}`);

                // Try to extract coordinates from the resolved URL
                // Google Maps URLs often look like: .../place/Name/@lat,lng,zoom... or ...!3dlat!4dlng...
                // or https://www.google.com/maps/search/?api=1&query=lat,lng

                // Regex for @lat,lng
                const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                if (atMatch) {
                    console.log(`  -> Coordinates (from @): ${atMatch[1]}, ${atMatch[2]}`);
                }

                // Regex for !3d...!4d... 
                // data=!3m1!4b1!4m5!3m4!1s...!8m2!3d9.0062406!4d38.7865618
                const dataMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                if (dataMatch) {
                    console.log(`  -> Coordinates (from data): ${dataMatch[1]}, ${dataMatch[2]}`);
                }

            } catch (err) {
                console.error(`  -> Error resolving URL: ${err.message}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

getLocations();
