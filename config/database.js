// config/database.js
const config = require('./index');

/**
 * Database configuration module
 * Exports database configuration for Sequelize
 */
module.exports = {
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    name: config.database.name,
    port: config.database.port,
    dialect: config.database.dialect,

    // Additional Sequelize options can be added here
    options: {
        host: config.database.host,
        port: config.database.port,
        dialect: config.database.dialect,
        logging: false, // Set to console.log to see SQL queries
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
};