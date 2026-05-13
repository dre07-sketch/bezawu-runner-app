const { pool } = require('./middleware/authMiddleware');

async function migrate() {
    try {
        await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50)");
        await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS vehicle_plate VARCHAR(50)");
        console.log("Added vehicle_type and vehicle_plate to orders.");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

migrate();
