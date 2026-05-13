const { pool } = require('./middleware/authMiddleware');

async function checkSchema() {
    try {
        console.log("Checking 'orders' table columns:");
        const ordersCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orders';
        `);
        console.table(ordersCols.rows);

        console.log("\nChecking 'runners' table columns:");
        const runnersCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'runners';
        `);
        console.table(runnersCols.rows);

        console.log("\nChecking 'customers' table columns:");
        const customersCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'customers';
        `);
        console.table(customersCols.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkSchema();
