// config/index.js
require('dotenv').config();

/**
 * Main configuration module that validates and exports environment variables
 */

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Export configuration object
module.exports = {
    database: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT, 10),
        dialect: 'postgres'
    },
    server: {
        port: parseInt(process.env.PORT, 10) || 3000
    }
};