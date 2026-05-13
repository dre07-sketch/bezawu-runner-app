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
        if (!url || !url.startsWith('http')) {
            return resolve(url);
        }
        https.get(url, { timeout: 5000 }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve(res.headers.location);
            } else {
                resolve(url);
            }
        }).on('error', (err) => {
            reject(err);
        }).on('timeout', () => {
            reject(new Error('Request timeout'));
        });
    });
}

function extractCoordinates(url) {
    if (!url) return null;

    // Try @lat,lng format
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
        return {
            latitude: parseFloat(atMatch[1]),
            longitude: parseFloat(atMatch[2])
        };
    }

    // Try !3d...!4d... format
    const dataMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (dataMatch) {
        return {
            latitude: parseFloat(dataMatch[1]),
            longitude: parseFloat(dataMatch[2])
        };
    }

    // Try query parameter format
    const queryMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (queryMatch) {
        return {
            latitude: parseFloat(queryMatch[1]),
            longitude: parseFloat(queryMatch[2])
        };
    }

    return null;
}

async function addLatLngColumns() {
    const client = await pool.connect();
    try {
        // Check if columns exist
        const checkQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'branches' 
            AND column_name IN ('latitude', 'longitude')
        `;
        const checkResult = await client.query(checkQuery);

        if (checkResult.rows.length === 0) {
            console.log('Adding latitude and longitude columns to branches table...');
            await client.query(`
                ALTER TABLE branches 
                ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
                ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8)
            `);
            console.log('Columns added successfully!');
        } else {
            console.log('Latitude and longitude columns already exist.');
        }
    } catch (err) {
        console.error('Error adding columns:', err);
    } finally {
        client.release();
    }
}

async function updateBranchCoordinates() {
    const client = await pool.connect();
    try {
        // Get all branches with map_pin
        const result = await client.query('SELECT id, name, map_pin FROM branches WHERE map_pin IS NOT NULL');

        console.log(`\nProcessing ${result.rows.length} branches...\n`);

        for (const branch of result.rows) {
            console.log(`Processing: ${branch.name}`);
            console.log(`  Map Pin: ${branch.map_pin}`);

            try {
                // Try to resolve shortened URL
                const resolvedUrl = await resolveUrl(branch.map_pin);
                console.log(`  Resolved URL: ${resolvedUrl}`);

                // Extract coordinates
                const coords = extractCoordinates(resolvedUrl);

                if (coords) {
                    console.log(`  ✓ Coordinates found: ${coords.latitude}, ${coords.longitude}`);

                    // Update database
                    await client.query(
                        'UPDATE branches SET latitude = $1, longitude = $2 WHERE id = $3',
                        [coords.latitude, coords.longitude, branch.id]
                    );
                    console.log(`  ✓ Database updated`);
                } else {
                    console.log(`  ✗ Could not extract coordinates`);
                }
            } catch (err) {
                console.error(`  ✗ Error: ${err.message}`);
            }

            console.log('');
        }

        console.log('Done!');

        // Show updated data
        const updatedResult = await client.query(
            'SELECT id, name, latitude, longitude, map_pin FROM branches ORDER BY name'
        );

        console.log('\n=== UPDATED BRANCHES ===\n');
        updatedResult.rows.forEach(branch => {
            console.log(`${branch.name}:`);
            console.log(`  Lat: ${branch.latitude || 'N/A'}, Lng: ${branch.longitude || 'N/A'}`);
            console.log(`  Map Pin: ${branch.map_pin || 'N/A'}`);
            console.log('');
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

async function main() {
    await addLatLngColumns();
    await updateBranchCoordinates();
}

main();
