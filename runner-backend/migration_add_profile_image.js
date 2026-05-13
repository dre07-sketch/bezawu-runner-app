const { pool } = require('./middleware/authMiddleware');

async function migrate() {
    try {
        console.log('Checking for profile_image column in runners table...');
        const checkCol = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'runners' AND column_name = 'pro_image'
        `);

        if (checkCol.rows.length === 0) {
            console.log('Adding pro_image column...');
            await pool.query('ALTER TABLE runners ADD COLUMN pro_image TEXT');
            console.log('Successfully added pro_image column.');
        } else {
            console.log('pro_image column already exists.');
        }

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        pool.end();
    }
}

migrate();
