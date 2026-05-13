const { pool } = require('./middleware/authMiddleware');

async function testCols() {
    try {
        console.log("Testing Orders Columns...");
        await pool.query("SELECT id, vehicle_color, vehicle_type, vehicle_plate FROM orders LIMIT 1");
        console.log("Orders Columns OK.");
    } catch (e) {
        console.log("Orders Columns MISSING or Error: " + e.message);
        // Fix it
        try {
            await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50)");
            await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS vehicle_plate VARCHAR(50)");
            await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS vehicle_color VARCHAR(50)");
            console.log("Fixed Orders Columns.");
        } catch (err) { console.error(err); }
    }

    try {
        console.log("Testing Runners Columns...");
        await pool.query("SELECT id, full_name FROM runners LIMIT 1");
        console.log("Runners Columns OK.");
    } catch (e) {
        console.log("Runners Columns MISSING or Error: " + e.message);
        // Fix it? Assuming 'name' exists if 'full_name' doesn't, but let's check
    }

    pool.end();
}

testCols();
