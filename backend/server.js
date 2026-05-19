require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const agentService = require('./services/agent.service');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

const dbPath = path.join(__dirname, './data/mock_db.json');

// --- Endpoints ---

// Get current system state
app.get('/api/state', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read state' });
    }
});

// Reset system state
app.post('/api/reset', (req, res) => {
    const initialState = {
        "shipments": [
          {
            "id": "SH-001",
            "origin": "Hamburg, Germany",
            "destination": "New York, USA",
            "status": "In Transit",
            "current_location": "North Atlantic",
            "eta": "2026-05-20",
            "items": ["Automotive Parts", "Precision Tools"],
            "priority": "High"
          },
          {
            "id": "SH-002",
            "origin": "Shanghai, China",
            "destination": "Los Angeles, USA",
            "status": "In Transit",
            "current_location": "Pacific Ocean",
            "eta": "2026-05-25",
            "items": ["Consumer Electronics"],
            "priority": "Medium"
          },
          {
            "id": "SH-003",
            "origin": "Rotterdam, Netherlands",
            "destination": "London, UK",
            "status": "Loading",
            "current_location": "Port of Rotterdam",
            "eta": "2026-05-18",
            "items": ["Medical Supplies"],
            "priority": "Critical"
          }
        ],
        "inventory": [
          {
            "item": "Microchips",
            "stock": 150,
            "reorder_point": 200,
            "status": "Low Stock"
          },
          {
            "item": "Lithium Batteries",
            "stock": 500,
            "reorder_point": 300,
            "status": "Healthy"
          }
        ],
        "logs": [],
        "notifications": []
      };
    fs.writeFileSync(dbPath, JSON.stringify(initialState, null, 2));
    res.json({ message: 'State reset successful' });
});

// Process new content (The Agent Entry Point)
app.post('/api/agent/process', async (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'No content provided' });

    try {
        const trace = await agentService.processContent(content);
        res.json(trace);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute a specific action
app.post('/api/agent/execute', async (req, res) => {
    const { actionId, trace } = req.body;
    try {
        const result = await agentService.executeAction(actionId, trace);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`[Antigravity Backend] Server running on port ${PORT}`);
});
