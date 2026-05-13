const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const profileRoutes = require('./routes/profile');
const walletRoutes = require('./routes/wallet');

const app = express();

// 1. Security & Core Middleware
const allowedOrigins = [
    'http://localhost:3692',
    'http://localhost:8238',
    'http://localhost:5173',
    'http://localhost:3002',
    'https://localhost:3002',
    'https://runner.bezawcurbside.com',
    'https://runnerapi.bezawcurbside.com',
    'https://bezawcurbside.com'
];

const corsOptionsDelegate = function (req, callback) {
    let corsOptions = {
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-client-id'],
        credentials: true
    };

    const origin = req.header('Origin');

    const isDomainAllowed = origin && (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.bezawcurbside.com') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('https://localhost')
    );

    if (!origin) {
        const userAgent = req.header('User-Agent') || '';
        if (req.header('x-client-id') === 'bezaw-mobile' || userAgent.includes('Dart')) {
            corsOptions.origin = true;
        } else {
            corsOptions.origin = false;
        }
    } else if (isDomainAllowed) {
        corsOptions.origin = true;
    } else {
        corsOptions.origin = false;
    }

    callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));
app.options('*', cors(corsOptionsDelegate));

app.use(express.json({ limit: '10kb' }));
app.use('/uploads', express.static('uploads', {
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));

app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
}));

// 2. Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/wallet', walletRoutes);

// 3. Root Endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Bezaw Runner API is active', status: 'Healthy' });
});

// 4. Server Start
const PORT = process.env.PORT || 5002;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bezaw Runner] Server running on port ${PORT}`);
    console.log(`[CORS] Localhost:3002 is authorized.`);
});
