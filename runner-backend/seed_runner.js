const { pool } = require('./middleware/authMiddleware');

async function seed() {
    try {
        // Find a branch
        const branchRes = await pool.query('SELECT id FROM branches LIMIT 1');
        if (branchRes.rows.length === 0) {
            console.log('No branches found. Cannot seed runner.');
            return;
        }
        const branchId = branchRes.rows[0].id;
        const runnerId = 'BZWR-DEMO-01'; // Easy to type

        // Upsert runner
        await pool.query(`
            INSERT INTO runners (id, branch_id, status, full_name)
            VALUES ($1, $2, 'active', 'Demo Runner')
            ON CONFLICT (id) DO UPDATE SET branch_id = $2
        `, [runnerId, branchId]);

        console.log(`Seeded Runner ID: ${runnerId}`);
        console.log(`Linked to Branch ID: ${branchId}`);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

seed();
