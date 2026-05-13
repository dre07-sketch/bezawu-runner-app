const { pool } = require('./middleware/authMiddleware');

async function migrate() {
    try {
        await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_car_image TEXT");
        console.log("Verified default_car_image in customers.");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

migrate();
