const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/mock_db.json');

const readDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

/**
 * Antigravity Agent Service
 * Orchestrates the Insight -> Action workflow
 */
class AgentService {
    async processContent(content) {
        console.log(`[Antigravity] Ingesting content: ${content.substring(0, 50)}...`);

        // 1. Ingest & Extract Key Facts (Simulated Reasoning)
        const facts = this.extractFacts(content);
        
        // 2. Insight Extraction
        const insight = this.generateInsight(facts);
        
        // 3. Impact Analysis
        const impact = this.analyzeImpact(insight);
        
        // 4. Action Generation
        const actions = this.generateActions(impact);
        
        const trace = {
            timestamp: new Date().toISOString(),
            content,
            facts,
            insight,
            impact,
            actions,
            status: 'PENDING_APPROVAL'
        };

        return trace;
    }

    extractFacts(content) {
        // Logic to extract facts from unstructured text
        // For the demo, we'll look for keywords related to ports, strikes, delays, or prices
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
                time_saved: '5 days'
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

    async executeAction(actionId, trace) {
        const db = readDB();
        const action = trace.actions.find(a => a.id === actionId);

        if (!action) throw new Error('Action not found');

        console.log(`[Antigravity] Executing action: ${action.type}`);

        // Simulate tool execution
        if (action.type === 'REROUTE') {
            const shipment = db.shipments.find(s => s.id === 'SH-001');
            if (shipment) {
                shipment.status = 'Rerouted';
                shipment.current_location = 'Diverting to Rotterdam';
                shipment.eta = '2026-05-22'; // 2 days earlier than the 10-day delay
            }
        }

        if (action.type === 'NOTIFY') {
            db.notifications.push({
                timestamp: new Date().toISOString(),
                message: `Client notified: ${action.description}`,
                status: 'Sent'
            });
        }

        db.logs.push({
            timestamp: new Date().toISOString(),
            action: action.type,
            result: 'Success',
            details: action.description
        });

        writeDB(db);
        return { status: 'SUCCESS', result: 'System state updated' };
    }
}

module.exports = new AgentService();
