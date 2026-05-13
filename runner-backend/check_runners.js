const { pool } = require('./middleware/authMiddleware');

async function check() {
    try {
        const cols = await pool.query(`SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'runners'`);
        console.log('Runners Schema:');
        console.table(cols.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

check();
