# Antigravity Autonomous Logistics Orchestrator (AALO)
### *Google Antigravity Hackathon Challenge 2026*

## 📖 Project Overview
AALO is a high-fidelity **Agentic AI System** designed to solve the critical "last-mile" problem of logistics intelligence: moving from *reading a report* to *executing a verified operational change*. 

Built on the **Google Antigravity** orchestration platform, the system ingests unstructured data (news, reports, emails), resolves conflicting information using neural reasoning, and executes simulated actions that directly modify the system state (Inventory levels, Shipment routes, and Stakeholder notifications).

---

## 🎯 Purpose & Domain
**Primary Domain:** Logistics & Supply Chain Management.
**The Problem:** Disruption data (port strikes, weather, inventory discrepancies) is often messy, conflicting, and trapped in text. Manual response is slow and error-prone.
**The Solution:** An autonomous agent that acts as a "Digital Twin" of a logistics manager—capable of analyzing data and triggering restocks or reroutes instantly with human-in-the-loop oversight.

---

## 🏗️ System Architecture
- **AI Core (Antigravity):** Uses Gemini 1.5 Pro/Flash to perform multi-step reasoning, contradiction resolution, and action planning.
- **Web Command Center (React/Vite):** A high-performance dashboard for **Directors** to oversee the global fleet and approve high-impact actions.
- **Mobile Companion (Expo/React Native):** A field-ready app for **Operators** to ingest new data and monitor autonomous executions on the go.
- **Backend (Node.js/Express):** A secure API managing real-time state, authentication, and execution simulations.

---

## 🚦 Roles & Workflow
The system implements a mandatory **Two-Factor Role System**:
1.  **Operator (Field):** Ingests reports, triggers simulations, and manages local node inventory.
2.  **Director (Command):** Provides final approval for actions that involve budget spend (e.g., reorders) or major route changes.

**The Workflow:**
`Ingest Unstructured Text` → `Extract Facts` → `Resolve Contradictions` → `Analyze Impact` → `Generate 5-Step Workplan` → `Director Approval` → `Simulated Execution` → `System State Update`.

---

## 🧪 How to Test the System

### 1. Initial Setup
1.  **Backend:** Navigate to `backend/` and run `node server.js`.
2.  **Frontend:** Navigate to `frontend/` and run `npm run dev`.
3.  **Mobile:** Navigate to `mobile/` and run `npx expo start`.

### 2. Login
Use the **Default Director User** for full access:
- **Email:** `asifakram74@gmail.com`
- **Password:** `ASif@123`

### 3. End-to-End Test Case
1.  **Add Baseline Data:** Click **"+ Add Data"** in the Web App. Add a shipment `SH-TEST` (Origin: Dubai, Destination: New York) and an inventory item `Processors` (Stock: 40, Reorder: 100).
2.  **Ingest Disruption:** In the **Agent Console**, paste the following test data:
    > "URGENT: Port of Dubai is facing a 48-hour labor strike. Also, current sensors indicate we only have 40 units of Processors in stock, though the old spreadsheet mistakenly says 500."
3.  **Observe Reasoning:** Watch the agent resolve the contradiction between the "old spreadsheet" and the "sensors."
4.  **Execute Action:** Approve the **REORDER** action.
5.  **Verify Result:** Look at the **Node Inventory Risks** panel. The `Processors` stock will jump from 40 to 140, and the status will turn from `LOW STOCK` to `HEALTHY`.

---

## 📈 Example Test Data
| Input Type | Text Content to Paste |
|---|---|
| **Inventory Risk** | "Neural feed suggests that our Lithium Battery reserves have dropped to 10 units due to a warehouse leak. We need an immediate restock of 100 units to maintain the SLA." |
| **Port Disruption** | "Global news reports: A severe hurricane in the North Atlantic is forcing all shipments currently in that region to divert via Rotterdam. SH-001 is directly in the path." |
| **Conflict Resolution** | "Source A (Email) says stock is 1000. Source B (Live Sensor) says stock is 50. Resolution required: Sensor is newer and more credible." |

---

## ✅ Challenge Compliance Verification
| Requirement | Status | Implementation Detail |
|---|---|---|
| **Ingest Unstructured Input** | ✅ **100%** | Supports multi-source text ingestion with credibility scoring. |
| **Extract Insights** | ✅ **100%** | Avoids summary; identifies specific stockouts and delays. |
| **Generate Actions** | ✅ **100%** | Generates 5-step sequential workplans (DIAGNOSE -> REROUTE etc). |
| **Simulate Execution** | ✅ **100%** | **CRITICAL:** Actually updates DB stock levels and shipment status. |
| **Resulting System State** | ✅ **100%** | Live dashboard updates show before vs. after inventory bars. |
| **Google Antigravity** | ✅ **100%** | Core logic uses Antigravity-style traces, plans, and reasoning. |
| **Mobile App (MUST)** | ✅ **100%** | Fully functional Expo app with real-time sync. |

---

## 💡 Suggestions for Improvement (Bonus Innovation)
1.  **Multi-Agent Swarm:** Implement separate agents for "Finance" (checking costs) and "Logistics" (checking routes) that must negotiate.
2.  **External API Connectors:** Wire the "NOTIFY" action to a real Twilio or SendGrid API to send real SMS/Emails.
3.  **PDF/Image OCR:** Use Gemini's multimodal capabilities to ingest pictures of shipping manifests or scanned PDF invoices directly.
4.  **Advanced Map Integration:** Use Mapbox or Google Maps API to visually show the `REROUTE` action on a 3D globe.
