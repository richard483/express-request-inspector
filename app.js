// app.js
const express = require('express');
const { sequelize, RequestLog } = require('./database'); // <-- IMPORT DATABASE CONFIG
const serverConfig = require('./config/server');
const app = express();
const PORT = serverConfig.port;

app.use(express.json());
app.use(express.text({ type: '*/*' }));

// --- PREDEFINED RULES (Unchanged) ---
const rules = [
    // ... (rules remain the same as before)
    {
        method: 'GET',
        path: '/health',
        response: { statusCode: 200, body: { status: 'ok' } }
    },
    {
        method: 'POST',
        path: '/api/users',
        response: { statusCode: 201, body: { userId: 123, message: 'User created.' } }
    },
    {
        method: 'GET',
        path: '/secret-data',
        headers: { 'x-api-key': 'my-secret-key' },
        response: { statusCode: 200, body: { data: 'This is secret information.' } }
    }
];

// The "catch-all" handler is now an ASYNC function
app.all('*', async (req, res) => { // <-- MADE ASYNC
    // --- 1. Print request details to the terminal (Unchanged) ---
    console.log('--- New Request Received ---');
    console.log(`Method: ${req.method}`);
    console.log(`Path: ${req.path}`);
    console.log('Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
        const bodyToPrint = typeof req.body === 'object' ? JSON.stringify(req.body, null, 2) : req.body;
        console.log('Body:', bodyToPrint);
    } else {
        console.log('Body: (empty)');
    }
    console.log('--------------------------\n');

    // --- 2. NEW: Save request data to the database ---
    try {
        // This part is slightly modified to handle JSON correctly for JSONB
        const bodyToSave = req.get('Content-Type') === 'application/json'
            ? req.body
            : { data: req.body }; // Wrap non-JSON body in an object for JSONB storage

        await RequestLog.create({
            method: req.method,
            path: req.path,
            headers: req.headers, // No need to stringify, Sequelize handles JSONB
            body: bodyToSave
        });
        console.log('📝 Request data saved to PostgreSQL.');
    } catch (error) {
        console.error('❌ Error saving request to PostgreSQL:', error);
    }

    // --- 3. Check for a matching rule (Unchanged) ---
    for (const rule of rules) {
        const methodMatch = rule.method === req.method;
        const pathMatch = rule.path === req.path;
        let headersMatch = true;
        if (rule.headers) {
            for (const key in rule.headers) {
                if (req.headers[key] !== rule.headers[key]) {
                    headersMatch = false;
                    break;
                }
            }
        }
        if (methodMatch && pathMatch && headersMatch) {
            console.log(`✅ Rule matched: [${rule.method}] ${rule.path}. Sending predefined response.`);
            return res.status(rule.response.statusCode).json(rule.response.body);
        }
    }

    // --- 4. If no rules match, send a default response (Unchanged) ---
    res.status(200).send('Request received, logged, and saved. No specific rule was matched.');
});

// --- NEW: Initialize Database and then Start Server ---
// We wrap app.listen in sequelize.sync() to ensure the database
// table is created before the server starts accepting requests.
sequelize.sync()
    .then(() => {
        console.log('✅ Database and tables synchronized.');
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('❌ Unable to connect to the database:', error);
    });