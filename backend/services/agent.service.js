const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const dbPath = path.join(__dirname, '../data/mock_db.json');

const readDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// Initialize Gemini API client if key is present
let genAI = null;
if (process.env.GEMINI_API_KEY) {
    console.log('[Antigravity Backend] Gemini API Key detected. Active AI reasoning enabled.');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
    console.warn('[Antigravity Backend] WARNING: GEMINI_API_KEY not found in environment. Falling back to rule-based mock reasoning.');
}

/**
 * Antigravity Agent Service
 * Orchestrates the Insight -> Action workflow using Google Gemini API
 */
class AgentService {
    async processContent(content) {
        console.log(`[Antigravity] Ingesting content: "${content.substring(0, 60)}..."`);

        // If Gemini is not configured, fall back to rule-based logic
        if (!genAI) {
            return this.processContentFallback(content);
        }

        try {
            const db = readDB();
            const shipments = db.shipments || [];
            const inventory = db.inventory || [];

            const systemInstruction = `
You are the "Google Antigravity Autonomous Logistics Agent", an advanced orchestrator for supply chain resilience.
Your job is to read unstructured news, reports, or messages, identify logistics-related insights, analyze their impact on the active shipments and inventory list provided, and propose concrete, realistic counter-measures (actions) to mitigate risks.

Active Shipments in Database:
${JSON.stringify(shipments, null, 2)}

Active Inventory in Database:
${JSON.stringify(inventory, null, 2)}

Analyze the incoming report:
"${content}"

You must output a single JSON object matching the following structure:
{
  "facts": [
    { "type": "disruption" | "location" | "cost" | "weather" | "geopolitical", "detail": "Specific factual detail extracted" }
  ],
  "insight": "A concise synthesis of what is happening based on the facts",
  "impact": {
    "severity": "Low" | "Medium" | "High" | "Critical",
    "description": "Specific impact explaining why this matters, what active shipments are at risk, and downstream consequences (e.g., manufacturing stops)",
    "affected_assets": ["SH-001"] // List of Shipment IDs affected. Must match IDs from the Active Shipments list! If none, leave empty [].
  },
  "actions": [
    {
      "id": "ACT-12345", // Generate a unique ID starting with ACT- followed by random digits
      "type": "REROUTE" | "NOTIFY" | "REORDER" | "INVESTIGATE",
      "description": "Action detail (e.g., Reroute SH-001 to Rotterdam and use express rail)",
      "cost_implication": "+$2,500" | "Negligible" | "etc.",
      "time_saved": "5 days" | "N/A" | "etc.",
      "target": "SH-001" // Target shipment ID, client name, or item name (e.g., 'Microchips' or 'SH-001')
    }
  ]
}

Strict requirements:
1. Ensure the JSON conforms exactly to the schema. Do not include markdown wraps or backticks in the response. Output only raw JSON.
2. If no active shipments or inventory items are affected, set severity to "Low", affected_assets to [], and propose minor actions (like INVESTIGATE or NOTIFY).
3. If a shipment is affected (e.g. Hamburg Port strike affects SH-001 originating or arriving at Hamburg; geopolitical issues in Red Sea affect Asia-to-Europe routes; Pacific issues affect Shanghai-to-LA SH-002), make sure to list it under affected_assets and propose a REROUTE action for that specific shipment.
4. If inventory is low and a news event might worsen it (or if inventory is mentioned), propose a REORDER or RESTOCK action.
`;

            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json"
                }
            });

            const result = await model.generateContent(systemInstruction);
            const responseText = result.response.text();
            
            console.log("[Antigravity] Gemini Response received successfully.");
            const trace = JSON.parse(responseText.trim());
            
            trace.timestamp = new Date().toISOString();
            trace.content = content;
            trace.status = 'PENDING_APPROVAL';

            return trace;
        } catch (error) {
            console.error('[Antigravity] Gemini processing failed:', error);
            console.warn('[Antigravity] Falling back to rule-based reasoning due to API error.');
            return this.processContentFallback(content);
        }
    }

    // --- Dynamic Action Executor ---
    async executeAction(actionId, trace) {
        const db = readDB();
        const action = trace.actions.find(a => a.id === actionId);

        if (!action) throw new Error('Action not found');

        console.log(`[Antigravity] Executing Action [${actionId}]: ${action.type}`);

        let targetShipmentId = action.target;
        // Fallback: search for SH-XXX in description if target is missing
        if (!targetShipmentId || !targetShipmentId.startsWith('SH-')) {
            const match = action.description.match(/SH-\d{3}/);
            if (match) {
                targetShipmentId = match[0];
            }
        }

        let executionResult = 'Success';
        let logDetails = action.description;

        if (action.type === 'REROUTE') {
            if (targetShipmentId) {
                const shipment = db.shipments.find(s => s.id === targetShipmentId);
                if (shipment) {
                    shipment.status = 'Rerouted';
                    
                    // Attempt to extract diversion location
                    let newLocation = 'Diverting to alternative port';
                    if (action.description.toLowerCase().includes('rotterdam')) {
                        newLocation = 'Diverting to Rotterdam';
                    } else if (action.description.toLowerCase().includes('cape of good hope')) {
                        newLocation = 'Diverted via Cape of Good Hope';
                    }
                    shipment.current_location = newLocation;

                    // Update ETA
                    if (action.time_saved && action.time_saved.includes('day')) {
                        const days = parseInt(action.time_saved);
                        if (!isNaN(days)) {
                            const date = new Date(shipment.eta);
                            date.setDate(date.getDate() - days);
                            shipment.eta = date.toISOString().split('T')[0];
                        }
                    } else {
                        // Default ETA adjustment
                        shipment.eta = new Date().toISOString().split('T')[0];
                    }
                    logDetails = `Shipment ${targetShipmentId} rerouted. Current location updated to: ${newLocation}.`;
                } else {
                    executionResult = 'Failed';
                    logDetails = `Reroute failed: Shipment ${targetShipmentId} not found in database.`;
                }
            } else {
                executionResult = 'Failed';
                logDetails = 'Reroute failed: No valid Shipment ID targeted in action.';
            }
        } else if (action.type === 'NOTIFY') {
            db.notifications.push({
                timestamp: new Date().toISOString(),
                message: `Alert: ${action.description}`,
                status: 'Sent'
            });
            logDetails = `Operator notification broadcasted: "${action.description}"`;
        } else if (action.type === 'REORDER' || action.type === 'RESTOCK') {
            // Find inventory item name from action target or description
            let itemToRestock = action.target;
            if (!itemToRestock) {
                const items = ['Microchips', 'Lithium Batteries'];
                itemToRestock = items.find(i => action.description.toLowerCase().includes(i.toLowerCase()));
            }

            if (itemToRestock) {
                const invItem = db.inventory.find(i => i.item.toLowerCase().includes(itemToRestock.toLowerCase()));
                if (invItem) {
                    invItem.stock += 100;
                    invItem.status = 'Healthy';
                    logDetails = `Inventory for ${invItem.item} restocked by 100 units. Status: Healthy.`;
                } else {
                    executionResult = 'Failed';
                    logDetails = `Reorder failed: Item "${itemToRestock}" not found in inventory.`;
                }
            } else {
                executionResult = 'Failed';
                logDetails = 'Reorder failed: Could not identify target item in inventory.';
            }
        } else {
            // Generic Action
            logDetails = `Executed operational action: ${action.description}`;
        }

        db.logs.push({
            timestamp: new Date().toISOString(),
            action: action.type,
            result: executionResult,
            details: logDetails
        });

        writeDB(db);
        return { status: executionResult, result: logDetails };
    }

    // --- Rule-Based Fallback logic if API Key is missing or fails ---
    processContentFallback(content) {
        console.log('[Antigravity] Using rule-based fallback logic...');
        const facts = this.extractFacts(content);
        const insight = this.generateInsight(facts);
        const impact = this.analyzeImpact(insight);
        const actions = this.generateActions(impact);

        return {
            timestamp: new Date().toISOString(),
            content,
            facts,
            insight,
            impact,
            actions,
            status: 'PENDING_APPROVAL'
        };
    }

    extractFacts(content) {
        const facts = [];
        if (content.toLowerCase().includes('strike') || content.toLowerCase().includes('blockade')) {
            facts.push({ type: 'disruption', detail: 'Labor strike or physical blockade detected' });
        }
        if (content.toLowerCase().includes('hamburg') || content.toLowerCase().includes('port')) {
            facts.push({ type: 'location', detail: 'Port of Hamburg, Germany' });
        }
        if (content.toLowerCase().includes('fuel') || content.toLowerCase().includes('price')) {
            facts.push({ type: 'cost', detail: 'Fluctuation in fuel/energy prices' });
        }
        return facts;
    }

    generateInsight(facts) {
        if (facts.some(f => f.type === 'disruption' && f.detail.includes('strike'))) {
            return "Major logistics bottleneck emerging at Port of Hamburg due to labor unrest.";
        }
        if (facts.some(f => f.type === 'cost')) {
            return "Rising operational costs detected in fuel-intensive transport sectors.";
        }
        return "Stable conditions, but monitoring for micro-disruptions in regional lanes.";
    }

    analyzeImpact(insight) {
        if (insight.includes('Hamburg')) {
            return {
                severity: 'High',
                description: 'Shipment SH-001 (Automotive Parts) is likely to be delayed by 7-10 days. Downstream manufacturing may stop.',
                affected_assets: ['SH-001']
            };
        }
        return {
            severity: 'Low',
            description: 'Minimal impact on current high-priority shipments.',
            affected_assets: []
        };
    }

    generateActions(impact) {
        const actions = [];
        if (impact.severity === 'High') {
            actions.push({
                id: 'ACT-' + Date.now(),
                type: 'REROUTE',
                description: 'Reroute SH-001 to Port of Rotterdam and use express rail to Hamburg.',
                cost_implication: '+$2,500',
                time_saved: '5 days',
                target: 'SH-001'
            });
            actions.push({
                id: 'ACT-' + (Date.now() + 1),
                type: 'NOTIFY',
                description: 'Alert Automotive Client (BMW Group) about potential 2-day delay.',
                target: 'BMW Logistics Team'
            });
        }
        return actions;
    }
}

module.exports = new AgentService();
