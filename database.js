// database.js
const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('./config/database');

// Initialize Sequelize with configuration from config module
const sequelize = new Sequelize(dbConfig.name, dbConfig.user, dbConfig.password, dbConfig.options);

// Define the model for the 'RequestLogs' table
const RequestLog = sequelize.define('RequestLog', {
    method: {
        type: DataTypes.STRING,
        allowNull: false
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    headers: {
        type: DataTypes.JSONB, // Using JSONB is more efficient in Postgres
        allowNull: true
    },
    body: {
        type: DataTypes.JSONB, // Changed to JSONB
        allowNull: true
    }
});

module.exports = { sequelize, RequestLog };