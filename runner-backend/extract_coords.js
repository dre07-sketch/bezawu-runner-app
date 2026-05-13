const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function resolveShortUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', redirect: 'manual' });
        const location = response.headers.get('location');
        if (location) return location;
        // If it follows redirect automatically (default fetch behavior sometimes), use final url
        const response2 = await fetch(url, { method: 'HEAD' });
        return response2.url;
    } catch (e) {
        console.error(`Error resolving ${url}:`, e.message);
        return url;
    }
}

function extractCoords(url) {
    // Try !3d...!4d... format (pb parameter)
    const pbMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pbMatch) return { lat: parseFloat(pbMatch[1]), lng: parseFloat(pbMatch[2]) };

    // Try @lat,lng format
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

    return null;
}

async function updateBranches() {
    try {
        const res = await pool.query('SELECT id, name, map_pin FROM branches');

        for (const branch of res.rows) {
            let url = branch.map_pin;
            if (!url) continue;

            console.log(`Processing ${branch.name}...`);

            if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
                console.log(`  Resolving short URL...`);
                url = await resolveShortUrl(url);
            }

            const coords = extractCoords(url);
            if (coords) {
                console.log(`  Found coords: ${coords.lat}, ${coords.lng}`);
                await pool.query('UPDATE branches SET latitude = $1, longitude = $2 WHERE id = $3', [coords.lat, coords.lng, branch.id]);
            } else {
                console.log(`  Could not extract coords from ${url}`);
                // Fallback for known ones if needed, or leave as null
            }
        }
        console.log('Update complete.');
        pool.end();
    } catch (err) {
        console.error(err);
        pool.end();
    }
}

updateBranches();
