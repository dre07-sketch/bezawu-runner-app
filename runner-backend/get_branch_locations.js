require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function getBranchLocations() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT 
                id, 
                name, 
                address,
                map_pin,
                phone,
                is_busy,
                status
            FROM branches 
            ORDER BY name
        `);

        let output = '\n=== BRANCH LOCATIONS ===\n\n';

        if (res.rows.length === 0) {
            output += 'No branches found in the database.\n';
        } else {
            res.rows.forEach((branch, index) => {
                output += `Branch ${index + 1}:\n`;
                output += `  ID: ${branch.id}\n`;
                output += `  Name: ${branch.name}\n`;
                output += `  Address: ${branch.address || 'N/A'}\n`;
                output += `  Map Pin: ${branch.map_pin || 'N/A'}\n`;
                output += `  Phone: ${branch.phone || 'N/A'}\n`;
                output += `  Status: ${branch.status}\n`;
                output += `  Is Busy: ${branch.is_busy}\n`;
                output += '\n';
            });

            output += `Total branches: ${res.rows.length}\n`;
        }

        // Write to file
        fs.writeFileSync('branch_locations.txt', output);
        console.log('Branch locations saved to branch_locations.txt');

        // Also write JSON format
        fs.writeFileSync('branch_locations.json', JSON.stringify(res.rows, null, 2));
        console.log('Branch locations (JSON) saved to branch_locations.json');

        // Display in console
        console.log(output);

    } catch (e) {
        console.error('Error fetching branch locations:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

getBranchLocations();
