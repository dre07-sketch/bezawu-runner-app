require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Linking Bundles to Branches...');

        await client.query('BEGIN');

        // 1. Add branch_id to bundles table
        await client.query(`
            ALTER TABLE bundles 
            ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50);
        `);

        // 2. Add Foreign Key Constraint
        // We add it conditionally or just try/catch
        try {
            await client.query(`
                ALTER TABLE bundles 
                ADD CONSTRAINT fk_branch_bundle 
                FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE;
            `);
        } catch (e) {
            console.log('Constraint might already exist:', e.message);
        }

        // 3. Assign existing bundles to a random branch (if any branches exist)
        const branchRes = await client.query('SELECT id FROM branches LIMIT 1');
        if (branchRes.rows.length > 0) {
            const branchId = branchRes.rows[0].id;
            console.log(`Assigning existing bundles to branch: ${branchId}`);

            await client.query(`
                UPDATE bundles 
                SET branch_id = $1 
                WHERE branch_id IS NULL
            `, [branchId]);

            // Enforce NOT NULL for future if desired, but let's keep it optional for global bundles?
            // User asked: "relate it with supermarktet or branches". 
            // Let's assume bundles belong to a branch.
            await client.query(`ALTER TABLE bundles ALTER COLUMN branch_id SET NOT NULL`);
        } else {
            console.log('No branches found. Cannot assign bundles to a branch yet.');
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
