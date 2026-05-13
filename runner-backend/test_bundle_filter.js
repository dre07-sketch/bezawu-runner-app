const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function test() {
    try {
        const client = await pool.connect();

        // 1. Get a branch ID
        const branchRes = await client.query("SELECT id, name FROM branches LIMIT 1");
        if (branchRes.rows.length === 0) {
            console.log('No branches found.');
            return;
        }
        const branch = branchRes.rows[0];
        console.log(`Testing with Branch: ${branch.name} (${branch.id})`);

        // 2. Fetch bundles for this branch
        console.log('Fetching bundles with filter...');
        const bundleRes = await client.query(`
            SELECT b.id, b.name, b.branch_id 
            FROM bundles b
            JOIN branches br ON b.branch_id = br.id
            WHERE b.is_active = true
            AND b.branch_id = '${branch.id}'
        `);

        if (bundleRes.rows.length === 0) {
            console.log('No bundles found for this branch.');
        } else {
            console.table(bundleRes.rows);
        }

        // 3. Fetch bundles for a FAKE branch
        console.log('Fetching bundles with FAKE filter...');
        const fakeRes = await client.query(`
            SELECT b.id, b.name 
            FROM bundles b
            WHERE b.is_active = true
            AND b.branch_id = 'FAKE_ID'
        `);
        console.log(`Fake branch returned ${fakeRes.rows.length} bundles (Should be 0).`);

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

test();
