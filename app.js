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

// --- NEW: Route to display last N requests in HTML table ---
app.get('/last-:number', async (req, res) => {
    try {
        const number = parseInt(req.params.number, 10);

        // Validate the number parameter
        if (isNaN(number) || number <= 0) {
            return res.status(400).send('<h1>Error: Invalid number. Please provide a positive integer.</h1>');
        }

        // Fetch the last N requests from the database
        const lastRequests = await RequestLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: number
        });

        // Generate HTML table
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Last ${number} Requests</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                pre {overflow-x: scroll;}
                tr:nth-child(even) { background-color: #f9f9f9; }
                .json-data { max-width: 360px; word-wrap: break-word; font-size: 12px; }
                .timestamp { white-space: nowrap; }
            </style>
        </head>
        <body>
            <h1>Last ${number} Request${number > 1 ? 's' : ''}</h1>
            <p>Total found: ${lastRequests.length}</p>
        `;

        if (lastRequests.length === 0) {
            html += '<p>No requests found in the database.</p>';
        } else {
            html += `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Timestamp</th>
                        <th>Method</th>
                        <th>Path</th>
                        <th>Headers</th>
                        <th>Body</th>
                    </tr>
                </thead>
                <tbody>
            `;

            lastRequests.forEach(request => {
                const timestamp = new Date(request.createdAt).toLocaleString();
                const headers = JSON.stringify(request.headers, null, 2);
                const body = request.body ? JSON.stringify(request.body, null, 2) : 'N/A';

                html += `
                    <tr>
                        <td>${request.id}</td>
                        <td class="timestamp">${timestamp}</td>
                        <td>${request.method}</td>
                        <td>${request.path}</td>
                        <td class="json-data"><pre>${headers}</pre></td>
                        <td class="json-data"><pre>${body}</pre></td>
                    </tr>
                `;
            });

            html += `
                </tbody>
            </table>
            `;
        }

        html += `
        </body>
        </html>
        `;

        res.send(html);

    } catch (error) {
        console.error('❌ Error fetching request logs:', error);
        res.status(500).send('<h1>Error: Unable to fetch request logs from database.</h1>');
    }
});

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