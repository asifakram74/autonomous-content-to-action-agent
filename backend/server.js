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
const usersPath = path.join(__dirname, './data/users.json');
const crypto = require('crypto');

function getUsers() {
    try {
        if (!fs.existsSync(usersPath)) {
            const dir = path.dirname(usersPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(usersPath, '[]');
        }
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        
        // Ensure default user always exists and cannot be deleted
        const defaultUsername = 'asifakram74@gmail.com';
        const hasDefault = users.some(u => u.username.toLowerCase() === defaultUsername.toLowerCase());
        if (!hasDefault) {
            const defaultUser = {
                username: defaultUsername,
                passwordHash: hashPassword('ASif@123'),
                email: 'asifakram74@gmail.com',
                role: 'Director',
                isDefault: true
            };
            users.push(defaultUser);
            fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        }
        return users;
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// --- Endpoints ---

// Register endpoint
app.post('/api/auth/register', (req, res) => {
    const { username, password, email, role } = req.body;
    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Username, password, and email are required' });
    }

    try {
        const users = getUsers();
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const passwordHash = hashPassword(password);
        const newUser = { username, passwordHash, email, role: role || 'Operator' };
        users.push(newUser);
        saveUsers(users);

        res.json({ message: 'Registration successful', username, role: newUser.role });
    } catch (error) {
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const users = getUsers();
        const user = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() || 
            (u.email && u.email.toLowerCase() === username.toLowerCase())
        );
        
        if (!user || user.passwordHash !== hashPassword(password)) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Return a mock token
        const token = crypto.createHash('md5').update(`${username}-${Date.now()}`).digest('hex');
        res.json({ 
            message: 'Login successful', 
            token, 
            user: { username: user.username, email: user.email, role: user.role || 'Operator' } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to authenticate user' });
    }
});

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
        "notifications": [],
        "activeTrace": null
      };
    fs.writeFileSync(dbPath, JSON.stringify(initialState, null, 2));
    res.json({ message: 'State reset successful' });
});

// Clear system logs
app.post('/api/logs/clear', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        data.logs = [];
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear logs' });
    }
});

// Clear system notifications
app.post('/api/notifications/clear', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        data.notifications = [];
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});

// Process new content (The Agent Entry Point)
app.post('/api/agent/process', async (req, res) => {
    const { content, sources } = req.body;
    if (!content && (!sources || sources.length === 0)) {
        return res.status(400).json({ error: 'No content or sources provided' });
    }

    try {
        const trace = await agentService.processContent(req.body);
        
        // Persist trace to mock db
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        db.activeTrace = trace;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        res.json(trace);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute a specific action
app.post('/api/agent/execute', async (req, res) => {
    const { actionId, simulateFailure } = req.body;
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const trace = db.activeTrace;
        if (!trace) {
            return res.status(400).json({ error: 'No active trace in database to execute.' });
        }

        const actionIndex = trace.actions.findIndex(a => a.id === actionId);
        if (actionIndex === -1) {
            return res.status(400).json({ error: 'Action not found in active trace.' });
        }

        // Set action status to EXECUTING
        trace.actions[actionIndex].status = 'EXECUTING';
        db.activeTrace = trace;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

        const result = await agentService.executeAction(actionId, trace, simulateFailure);

        // Re-read database to get state updates
        const updatedDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const updatedTrace = updatedDb.activeTrace || trace;

        if (result.rolledBack) {
            updatedTrace.status = 'FAILED';
            updatedTrace.actions = updatedTrace.actions.map(a => {
                if (a.step <= updatedTrace.actions[actionIndex].step) {
                    return { ...a, status: 'ROLLED_BACK', resultText: 'Rolled Back to Safe State' };
                }
                return a;
            });
        } else {
            updatedTrace.actions[actionIndex].status = 'SUCCESS';
            updatedTrace.actions[actionIndex].resultText = result.result;
            
            // Adjust recommended cost in trace if adjusted by policy constraint
            if (result.result.includes('adjusted')) {
                updatedTrace.actions[actionIndex].cost = updatedTrace.actions[actionIndex].cost - 1500;
            }

            const allSuccess = updatedTrace.actions.every(a => a.status === 'SUCCESS');
            if (allSuccess) {
                updatedTrace.status = 'COMPLETED';
            } else {
                updatedTrace.status = 'EXECUTING';
            }
        }

        updatedDb.activeTrace = updatedTrace;
        fs.writeFileSync(dbPath, JSON.stringify(updatedDb, null, 2));

        res.json({ ...result, trace: updatedTrace });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Request Director Approval (Operator Flow)
app.post('/api/agent/request-approval', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (!db.activeTrace) {
            return res.status(400).json({ error: 'No active trace available for approval.' });
        }
        db.activeTrace.status = 'PENDING_APPROVAL';
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Workplan submitted for Director approval', trace: db.activeTrace });
    } catch (error) {
        res.status(500).json({ error: 'Failed to request approval' });
    }
});

// Approve Trace Workplan (Director Flow)
app.post('/api/agent/approve', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        if (!db.activeTrace) {
            return res.status(400).json({ error: 'No active trace available to approve.' });
        }
        db.activeTrace.status = 'APPROVED';
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Workplan approved by Director', trace: db.activeTrace });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve trace' });
    }
});

// ── Shipment CRUD ──────────────────────────────────────────────────────────

// Add a new shipment
app.post('/api/shipments', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const { id, origin, destination, status, current_location, eta, items, priority } = req.body;
        if (!id || !origin || !destination) {
            return res.status(400).json({ error: 'id, origin, and destination are required' });
        }
        if (db.shipments.find(s => s.id === id)) {
            return res.status(400).json({ error: `Shipment ${id} already exists` });
        }
        const shipment = {
            id,
            origin,
            destination,
            status: status || 'Pending',
            current_location: current_location || origin,
            eta: eta || '',
            items: Array.isArray(items) ? items : (items ? [items] : []),
            priority: priority || 'Medium'
        };
        db.shipments.push(shipment);
        db.logs.push({ timestamp: new Date().toISOString(), action: 'SHIPMENT_ADDED', result: 'Success', details: `New shipment ${id} from ${origin} to ${destination} added to system.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Shipment added', shipment });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update an existing shipment
app.put('/api/shipments/:id', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const idx = db.shipments.findIndex(s => s.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Shipment not found' });
        db.shipments[idx] = { ...db.shipments[idx], ...req.body, id: req.params.id };
        db.logs.push({ timestamp: new Date().toISOString(), action: 'SHIPMENT_UPDATED', result: 'Success', details: `Shipment ${req.params.id} updated manually.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Shipment updated', shipment: db.shipments[idx] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete a shipment
app.delete('/api/shipments/:id', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const idx = db.shipments.findIndex(s => s.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'Shipment not found' });
        db.shipments.splice(idx, 1);
        db.logs.push({ timestamp: new Date().toISOString(), action: 'SHIPMENT_REMOVED', result: 'Success', details: `Shipment ${req.params.id} removed from system.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Shipment deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ── Inventory CRUD ─────────────────────────────────────────────────────────

// Add a new inventory item
app.post('/api/inventory', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const { item, stock, reorder_point } = req.body;
        if (!item || stock === undefined) {
            return res.status(400).json({ error: 'item and stock are required' });
        }
        if (db.inventory.find(i => i.item.toLowerCase() === item.toLowerCase())) {
            return res.status(400).json({ error: `Inventory item "${item}" already exists` });
        }
        const rp = reorder_point || Math.floor(stock * 0.4);
        const newItem = {
            item,
            stock: Number(stock),
            reorder_point: Number(rp),
            status: Number(stock) <= Number(rp) ? 'Low Stock' : 'Healthy'
        };
        db.inventory.push(newItem);
        db.logs.push({ timestamp: new Date().toISOString(), action: 'INVENTORY_ADDED', result: 'Success', details: `New inventory item "${item}" added with stock ${stock}.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Inventory item added', item: newItem });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update inventory item by name
app.put('/api/inventory/:item', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const idx = db.inventory.findIndex(i => i.item.toLowerCase() === req.params.item.toLowerCase());
        if (idx === -1) return res.status(404).json({ error: 'Inventory item not found' });
        const updated = { ...db.inventory[idx], ...req.body };
        updated.status = Number(updated.stock) <= Number(updated.reorder_point) ? 'Low Stock' : 'Healthy';
        db.inventory[idx] = updated;
        db.logs.push({ timestamp: new Date().toISOString(), action: 'INVENTORY_UPDATED', result: 'Success', details: `Inventory item "${req.params.item}" updated. Stock: ${updated.stock}.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Inventory updated', item: db.inventory[idx] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Delete inventory item by name
app.delete('/api/inventory/:item', (req, res) => {
    try {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const idx = db.inventory.findIndex(i => i.item.toLowerCase() === req.params.item.toLowerCase());
        if (idx === -1) return res.status(404).json({ error: 'Inventory item not found' });
        db.inventory.splice(idx, 1);
        db.logs.push({ timestamp: new Date().toISOString(), action: 'INVENTORY_REMOVED', result: 'Success', details: `Inventory item "${req.params.item}" removed from system.` });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        res.json({ message: 'Inventory item deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`[Antigravity Backend] Server running on port ${PORT}`);
});

