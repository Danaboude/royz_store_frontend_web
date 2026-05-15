// api/db/db.js
const mysql = require('mysql2/promise'); 
require('dotenv').config();

// TiDB Cloud Serverless usually requires SSL.
// The connection details will be provided via Environment Variables in Vercel.
const pool = mysql.createPool({ 
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000, // TiDB default port is 4000
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true // Set to true for production security with TiDB
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test database connection
(async () => {
    try {
        await pool.query('SELECT 1'); 
        console.log('✅ Database connected successfully');
    } catch (err) {
        console.error('❌ Database connection failed!', err);
    }
})();

// Create a cache object for compatibility
const cache = {
    redisClient: null
};

// Add getConnection method for transactions
const getConnection = async () => {
    return await pool.getConnection();
};

module.exports = { pool, cache, getConnection }; 