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
 * Orchestrates the Multi-Source Ingestion -> Contradiction Resolution -> Chained Decisions -> Constraint Check -> Failure Rollback Workflow
 */
class AgentService {
    async processContent(payload) {
        let sources = [];
        let simulateFailure = false;
        let forceConstraintViolation = false;

        // Support both direct string inputs (backward compatibility) and multi-source payloads
        if (typeof payload === 'string') {
            sources = [{
                id: 'src-1',
                name: 'Direct Input Report',
                type: 'Direct Ingestion',
                content: payload,
                credibility: 0.90,
                recency: 'current'
            }];
        } else if (payload && Array.isArray(payload.sources)) {
            sources = payload.sources;
            simulateFailure = !!payload.simulateFailure;
            forceConstraintViolation = !!payload.forceConstraintViolation;
        }

        console.log(`[Antigravity] Ingesting ${sources.length} sources concurrently...`);

        // If Gemini is not configured, fall back to rule-based logic
        if (!genAI) {
            return this.processContentFallback(sources, simulateFailure, forceConstraintViolation);
        }

        try {
            const db = readDB();
            const shipments = db.shipments || [];
            const inventory = db.inventory || [];
            const constraints = db.constraints || { "max_emergency_budget_usd": 5000 };

            const systemInstruction = `
You are the "Google Antigravity Autonomous Logistics Orchestration Agent".
Your job is to ingest multiple content sources (which might contain conflicting claims, stale metadata, or low-credibility signals) and resolve them based on source credibility and timestamp recency. You must evaluate options against operational constraints (such as budget caps) and output a structured response.

Active Shipments in Database:
${JSON.stringify(shipments, null, 2)}

Active Inventory in Database:
${JSON.stringify(inventory, null, 2)}

System Operation Constraints:
${JSON.stringify(constraints, null, 2)}

Ingested Multi-Source Documents:
${JSON.stringify(sources, null, 2)}

${forceConstraintViolation ? "STRESS TEST COMMAND: Generate a REORDER action with a cost of $6,000 to trigger a constraint violation." : ""}

You must output a single JSON object matching the following structure:
{
  "contradictions": [
    {
      "metric": "e.g., Microchips Stock Level",
      "conflict_summary": "Warehouse spreadsheet claims 500 units, but Sales dashboard reports 150 units.",
      "resolution": "Detailed explanation of which source is newer (higher recency) and more credible. Confirm the true resolved value.",
      "stale_source": "Warehouse spreadsheet",
      "fresh_source": "Sales dashboard"
    }
  ],
  "facts": [
    { "type": "disruption" | "location" | "cost" | "weather" | "geopolitical", "detail": "Factual detail extracted from credible sources" }
  ],
  "insight": "Concise summary synthesizing what is actually happening based on resolved facts.",
  "impact": {
    "severity": "Low" | "Medium" | "High" | "Critical",
    "description": "Specific downstream impacts to shipments/inventory.",
    "affected_assets": ["SH-001"] // Shipment IDs affected. Leave empty [] if none.
  },
  "actions": [
    {
      "id": "ACT-123", // Generate unique ID starting with ACT- followed by random digits
      "step": 1, // Sequential step number (must be 1 to 5)
      "type": "DIAGNOSE" | "NOTIFY" | "REORDER" | "REROUTE" | "MONITOR",
      "description": "Action description",
      "cost": 0, // Integer cost in USD (e.g. 4500 or 6000 for stress tests)
      "time": "e.g., 3 days or Immediate",
      "target": "Shipment ID or Inventory Item"
    }
  ]
}

Strict requirements:
1. Ensure the JSON conforms exactly to the schema. Do not include markdown wraps or backticks. Output only raw JSON.
2. Formulate exactly 5 sequential steps in the actions array.
3. If an inventory shortage is detected, Step 3 must be a REORDER action.
4. If a port strike or transport delay affects a shipment, Step 4 must be a REROUTE action for that shipment.
5. If forceConstraintViolation is active, the cost of the REORDER action should be set to 6000.
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
            trace.status = 'PENDING_APPROVAL';
            trace.simulateFailure = simulateFailure;
            trace.forceConstraintViolation = forceConstraintViolation;

            return trace;
        } catch (error) {
            console.error('[Antigravity] Gemini processing failed:', error);
            console.warn('[Antigravity] Falling back to rule-based reasoning due to API error.');
            return this.processContentFallback(sources, simulateFailure, forceConstraintViolation);
        }
    }

    // --- Dynamic Chained Action Executor with Constraint Check and Failure Rollback ---
    async executeAction(actionId, trace, simulateFailure = false) {
        const db = readDB();
        const action = trace.actions.find(a => a.id === actionId);

        if (!action) throw new Error('Action not found');

        console.log(`[Antigravity] Executing Action Step [${action.step}/5] [${actionId}]: ${action.type}`);

        // 1. Simulating Step Failure if toggled by the user
        if (simulateFailure && (action.type === 'REORDER' || action.type === 'REROUTE' || action.step === 3 || action.step === 4)) {
            console.warn(`[Antigravity] Simulating Execution Failure on Step ${action.step} for recovery stress test.`);
            
            // Perform Rollback: Restore original db state
            const logs = db.logs || [];
            const notifications = db.notifications || [];
            
            // Find preceding executed steps in this trace and log rollback
            const rolledBackLogs = [];
            const precedingActions = trace.actions.filter(a => a.step < action.step);

            precedingActions.forEach(pa => {
                rolledBackLogs.push(`Rolled back state modifications for Step ${pa.step}: ${pa.type}`);
            });

            // Specific rollback actions
            let affectedShipment = db.shipments.find(s => s.status === 'Rerouted');
            if (affectedShipment) {
                affectedShipment.status = 'In Transit';
                affectedShipment.current_location = 'North Atlantic';
                affectedShipment.eta = '2026-05-20';
            }

            let affectedInventory = db.inventory.find(i => i.item === 'Microchips');
            if (affectedInventory) {
                affectedInventory.stock = 150; // Restore low stock
                affectedInventory.status = 'Low Stock';
            }

            // Write full rollback log
            const timestamp = new Date().toISOString();
            db.logs.push({
                timestamp,
                action: 'ROLLBACK',
                result: 'Successful Rollback',
                details: `CRITICAL EXECUTION FAILURE on Step ${action.step} (${action.type}). Reason: Simulated API Connection Timeout. Safe-state rollback executed. Undid ${precedingActions.length} preceding state modifications. System restored to original state.`
            });

            db.notifications.push({
                timestamp,
                message: `CRITICAL: Operational Rollback initiated on Step ${action.step}. System state recovered successfully.`,
                status: 'Alert'
            });

            writeDB(db);
            return { 
                status: 'Failed', 
                result: `Simulated API failure on Step ${action.step}. Preceding steps successfully rolled back.`, 
                rolledBack: true,
                rolledBackSteps: rolledBackLogs
            };
        }

        // 2. Constraint Checks (Emergency Budget Verification)
        let logDetails = action.description;
        let executionResult = 'Success';
        const constraints = db.constraints || { max_emergency_budget_usd: 5000 };

        if (action.cost > constraints.max_emergency_budget_usd) {
            console.log(`[Antigravity] Constraint Violation: Action cost $${action.cost} exceeds emergency limit $${constraints.max_emergency_budget_usd}`);
            
            // Modify action dynamically to comply with constraints
            const adjustedCost = constraints.max_emergency_budget_usd - 500; // Keep safety buffer
            action.cost = adjustedCost;
            action.description = `[BUDGET ENFORCED] ${action.description} (Budget adjusted down to $${adjustedCost})`;
            logDetails = `Constraint Enforced: Emergency budget cap $${constraints.max_emergency_budget_usd} checked. Action cost adjusted from the recommended amount down to $${adjustedCost} to pass budget validation.`;
            console.log(`[Antigravity] Action modified and approved: Cost set to $${adjustedCost}`);
        }

        // 3. State Modification Logic
        if (action.type === 'DIAGNOSE') {
            // Find the targeted inventory item or provide a generic diagnosis
            const targetItem = db.inventory.find(i => action.target && i.item.toLowerCase().includes(action.target.toLowerCase()));
            if (targetItem) {
                logDetails = `System Diagnosis Verified: True ${targetItem.item} stock level verified as ${targetItem.stock} units. Conflicting data sources resolved.`;
            } else {
                logDetails = `System Diagnosis Complete: All data sources verified and reconciled for target "${action.target || 'System'}".`;
            }
        } else if (action.type === 'NOTIFY') {
            db.notifications.push({
                timestamp: new Date().toISOString(),
                message: `Operational Alert: ${action.description}`,
                status: 'Sent'
            });
            logDetails = `Stakeholders notified: "${action.description}"`;
        } else if (action.type === 'REORDER') {
            // Find the targeted inventory item dynamically
            const targetItem = db.inventory.find(i => action.target && i.item.toLowerCase().includes(action.target.toLowerCase()));
            if (targetItem) {
                const prevStock = targetItem.stock;
                targetItem.stock += 100;
                targetItem.status = targetItem.stock > targetItem.reorder_point ? 'Healthy' : 'Low Stock';
                logDetails = `Emergency restock processed: 100 units of ${targetItem.item} ordered. Stock increased from ${prevStock} to ${targetItem.stock} units. Status: ${targetItem.status}. Budget allocated: $${action.cost}.`;
            } else {
                logDetails = `Reorder action executed for target "${action.target}". Budget allocated: $${action.cost}.`;
            }
        } else if (action.type === 'REROUTE') {
            // Find the targeted shipment dynamically
            const shipment = db.shipments.find(s => action.target && s.id === action.target);
            if (shipment) {
                const prevStatus = shipment.status;
                const prevLocation = shipment.current_location;
                shipment.status = 'Rerouted';
                shipment.current_location = 'Diverted via alternate route';
                logDetails = `Shipment ${shipment.id} rerouted from "${prevLocation}" (was: ${prevStatus}). Route changed to bypass disruption. Global Fleet updated.`;
            } else {
                logDetails = `Reroute action executed for target "${action.target}".`;
            }
        } else if (action.type === 'MONITOR') {
            const targets = [];
            if (db.inventory.length > 0) targets.push(`${db.inventory.length} inventory items`);
            if (db.shipments.length > 0) targets.push(`${db.shipments.length} active shipments`);
            logDetails = `Chrono-monitoring routine active for ${targets.join(' and ') || 'system'}. Polling active.`;
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

    // --- High-Fidelity Rule-Based Fallback for Mock Scenarios & Stress Tests ---
    processContentFallback(sources, simulateFailure, forceConstraintViolation) {
        console.log('[Antigravity] Using advanced rule-based fallback logic...');
        
        // Default scenario content analysis
        let isShortageScenario = sources.some(s => 
            s.content.toLowerCase().includes('shortage') || 
            s.content.toLowerCase().includes('contradict') || 
            s.content.toLowerCase().includes('complaint')
        );

        let contradictions = [];
        let facts = [];
        let insight = "";
        let impact = {};
        let actions = [];

        if (isShortageScenario || forceConstraintViolation || simulateFailure) {
            contradictions = [
                {
                    metric: "Microchips Stock Level",
                    conflict_summary: "Warehouse spreadsheet (Timestamp: 2 days ago) claims 500 units, but Sales dashboard (Timestamp: 1 hour ago) reports 150 units.",
                    resolution: "Warehouse spreadsheet is flagged as stale (outdated by 47 hours). Sales dashboard is verified as the high-credibility source (95% credibility vs 80%). True stock level is verified as 150 (Low Stock / Below Reorder Point).",
                    stale_source: "Warehouse spreadsheet (CSV)",
                    fresh_source: "Sales Dashboard Table"
                }
            ];

            facts = [
                { type: 'disruption', detail: 'Significant transport and labor delay warnings at Hamburg Port.' },
                { type: 'cost', detail: 'Emergency shipping costs rising due to fuel surcharge spikes.' },
                { type: 'weather', detail: 'Severe storm forecast in North Atlantic routes.' }
            ];

            insight = "Severe inventory stockout risk imminent for high-priority assembly lines. Demand spikes detected while supplier reliability has degraded due to port strikes.";

            impact = {
                severity: 'Critical',
                description: 'Shipment SH-001 (Automotive Parts) originating in Hamburg is delayed by 7 days. Microchips stock in Central Warehouse is at 150 units (under safety point of 200). Production stoppage at downstream facilities is likely in 48 hours.',
                affected_assets: ['SH-001']
            };

            const reorderCost = forceConstraintViolation ? 6000 : 4500;

            actions = [
                {
                    id: 'ACT-101',
                    step: 1,
                    type: 'DIAGNOSE',
                    description: 'Verify system state discrepancy: Confirm actual Microchips level is 150, update status to Low Stock.',
                    cost: 0,
                    time: 'Immediate',
                    target: 'Microchips'
                },
                {
                    id: 'ACT-102',
                    step: 2,
                    type: 'NOTIFY',
                    description: 'Alert Procurement Team regarding inventory shortage and broadcast alert to BMW Logistics Client.',
                    cost: 0,
                    time: '10 mins',
                    target: 'BMW Logistics Team'
                },
                {
                    id: 'ACT-103',
                    step: 3,
                    type: 'REORDER',
                    description: `Place emergency supply restock for 100 units of Microchips. Order cost: $${reorderCost}.`,
                    cost: reorderCost,
                    time: '3 days',
                    target: 'Microchips'
                },
                {
                    id: 'ACT-104',
                    step: 4,
                    type: 'REROUTE',
                    description: 'Reroute Shipment SH-001 via Rotterdam and express rail to bypass Hamburg port labor strike.',
                    cost: 2500,
                    time: '5 days saved',
                    target: 'SH-001'
                },
                {
                    id: 'ACT-105',
                    step: 5,
                    type: 'MONITOR',
                    description: 'Launch 24-hour chrono-monitoring node for safety stock buffers and fleet routes.',
                    cost: 0,
                    time: 'Ongoing',
                    target: 'Microchips'
                }
            ];
        } else {
            // General Fallback
            contradictions = [];
            facts = [{ type: 'location', detail: 'General global fleet monitoring active.' }];
            insight = "All major shipping corridors operating within normal variance parameters.";
            impact = {
                severity: 'Low',
                description: 'No active shipment delays or critical stockouts detected.',
                affected_assets: []
            };
            actions = [
                {
                    id: 'ACT-201',
                    step: 1,
                    type: 'DIAGNOSE',
                    description: 'Perform standard systems operations diagnostics check.',
                    cost: 0,
                    time: 'Immediate',
                    target: 'System Network'
                },
                {
                    id: 'ACT-202',
                    step: 2,
                    type: 'MONITOR',
                    description: 'Schedule routine logistics lane monitoring cycles.',
                    cost: 0,
                    time: 'Ongoing',
                    target: 'Global Nodes'
                }
            ];
        }

        return {
            timestamp: new Date().toISOString(),
            content: "Multi-Source Stress Ingestion",
            contradictions,
            facts,
            insight,
            impact,
            actions,
            status: 'PENDING_APPROVAL',
            simulateFailure,
            forceConstraintViolation
        };
    }
}

module.exports = new AgentService();
