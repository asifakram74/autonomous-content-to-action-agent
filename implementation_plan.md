# Autonomous Supply Chain Agent (Insight → Action)

This project implements an Agentic AI System that transforms unstructured supply chain news and reports into actionable logistics outcomes. It uses Google Antigravity principles to orchestrate reasoning, planning, and execution.

## User Review Required

> [!IMPORTANT]
> The project requires a mobile app (MUST) and a web app (Optional). I will build both to ensure maximum points.
> The "Mobile App" will be built using React Native (Expo) for ease of demonstration.

> [!NOTE]
> I will use a "Supply Chain Logistics" domain as it provides clear, high-impact "Insight to Action" scenarios.

## Proposed Changes

### 1. Project Structure
Create three main directories to separate concerns:
- `backend/`: Node.js Express server with Agent logic.
- `frontend/`: React (Vite) web dashboard.
- `mobile/`: React Native (Expo) mobile application.

---

### 2. Backend (Node.js / Express)
The backend will serve as the "Brain" where the Antigravity agent logic resides.

#### [NEW] `backend/server.js`
- Entry point for the API.
- Endpoints for data ingestion, agent execution, and state management.

#### [NEW] `backend/services/agent.service.js`
- Core Agent logic:
    1. **Ingest**: Process text/articles.
    2. **Insight**: Extract key signals (e.g., "Port Strike in Hamburg").
    3. **Impact**: Calculate delays/cost increases.
    4. **Plan**: Generate action steps (e.g., "Reroute Shipments", "Notify Clients").
    5. **Execute**: Call tools (Mock APIs) to simulate changes.

#### [NEW] `backend/data/mock_db.json`
- Stores system state: Shipments, Inventory, Notifications.

---

### 3. Frontend (React / Vite)
A premium "Global Command Center" dashboard.

#### [NEW] `frontend/src/App.jsx`
- Main dashboard layout.
- Real-time feed of ingested content.
- Visualization of the Agent's reasoning trace (using a step-by-step UI).
- Before/After state comparison maps/charts.

#### [NEW] `frontend/src/index.css`
- Core design system: Dark mode, Glassmorphism, Neon accents.

---

### 4. Mobile App (React Native / Expo)
A companion app for action approvals and monitoring.

#### [NEW] `mobile/App.js`
- Mobile-optimized view of the Supply Chain state.
- "Action Required" push notification simulator.
- Quick approval/rejection of agent-generated plans.

---

## Agentic Workflow (Antigravity Orchestration)

The system will demonstrate a traceable decision-making flow:
1. **Unstructured Data** -> Input.
2. **Signal Extraction Agent** -> Identifies "What happened".
3. **Strategic Impact Agent** -> Evaluates "Why it matters".
4. **Action Planner Agent** -> Proposes "What to do".
5. **Execution Engine** -> Simulates tool usage (e.g., `POST /api/reroute`).
6. **Feedback Loop** -> Updates the UI with the "Resulting State".

## Verification Plan

### Automated Tests
- Script to feed unstructured text and verify the `Action` output.
- Mock API tests to ensure system state updates correctly.

### Manual Verification
- Visual inspection of the "Before vs After" state on the dashboard.
- Testing the Mobile-to-Backend interaction for action approval.
- Recording the Agent Trace logs for the deliverable.
