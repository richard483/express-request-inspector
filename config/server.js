// config/server.js
const config = require('./index');

/**
 * Server configuration module
 * Exports server configuration settings
 */
module.exports = {
    port: config.server.port,

    // Additional server configurations can be added here
    options: {
        // Express app settings
        trustProxy: false,

        // CORS settings (if needed)
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        },

        // Body parser limits
        bodyParser: {
            json: { limit: '10mb' },
            urlencoded: { limit: '10mb', extended: true }
        }
    }
};