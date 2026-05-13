const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
}

const verifyToken = async (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
        req.user = decoded;

        // VERIFY USER EXISTENCE IN DB to prevent FK violations later
        if (decoded.role === 'customer') {
            const userCheck = await pool.query('SELECT id FROM customers WHERE id = $1', [decoded.id]);
            if (userCheck.rows.length === 0) {
                return res.status(401).json({ message: 'User no longer exists. Please login again.' });
            }
        } else if (decoded.role === 'runner') {
            const runnerCheck = await pool.query('SELECT status FROM runners WHERE id = $1', [decoded.id]);
            if (runnerCheck.rows.length === 0) {
                return res.status(401).json({ message: 'Runner ID not found. Please login again.' });
            }
            const runnerStatus = runnerCheck.rows[0].status;
            if (runnerStatus && runnerStatus.toUpperCase() === 'INACTIVE') {
                return res.status(403).json({ message: 'your access to the bezaw runner portal is INACTIVE.' });
            }
        }

        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = { verifyToken, pool };
