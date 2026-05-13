const { pool } = require('./middleware/authMiddleware');

async function migrate() {
    try {
        await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS vehicle_color VARCHAR(50)");
        console.log("Added vehicle_color to orders.");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

migrate();
