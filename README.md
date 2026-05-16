# Antigravity Autonomous Logistics Agent

An Agentic AI System that transforms unstructured logistics news and reports into actionable supply chain outcomes. Built for the **Google Antigravity Hackathon Challenge 2026**.

## 🚀 Overview
This system monitors unstructured information (news, port reports, fuel prices) and uses an autonomous agent to:
1. **Understand**: Parse raw text into structured facts.
2. **Insight**: Identify meaningful signals (e.g., strikes, blockades).
3. **Impact**: Analyze real-world consequences for active shipments.
4. **Action**: Generate and simulate execution of corrective measures (e.g., rerouting).

## 🏗️ Architecture
- **Backend**: Node.js / Express. The "Brain" of the system where the Agentic Workflow is orchestrated.
- **Web Frontend**: React / Vite. A high-performance "Command Center" dashboard for global visibility.
- **Mobile App**: React Native / Expo. A companion app for monitoring and approvals on-the-go.

## 🤖 How Antigravity is Used
Google Antigravity serves as the core orchestration engine. The system follows a **Traceable Reasoning Flow**:
- **Ingestion**: Raw content is pushed to the Antigravity service.
- **Reasoning Trace**: The agent generates a step-by-step trace (displayed in the UI) showing how it reached its decision.
- **Tool Integration**: The agent calls mock APIs to update the "System State" (Shipment locations, ETA, Notifications).

## 🛠️ Tools & APIs
- **Logic**: Custom Agentic Reasoning Service.
- **State Management**: Mock DB (JSON-based persistence).
- **Icons & UI**: Lucide React, Framer Motion (Web), React Native Elements (Mobile).
- **Networking**: Axios.

## 🏃 How to Run

### 1. Backend
```bash
cd backend
npm install
node server.js
```

### 2. Frontend (Web)
```bash
cd frontend
npm install
npm run dev
```

### 3. Mobile (Native)
```bash
cd mobile
npm install
npx expo start
```

## 📝 Assumptions & Scenarios
- **Scenario 1**: Hamburg Port Strike. The agent detects the strike, identifies shipment SH-001 is at risk, and reroutes it via Rotterdam, updating the ETA and saving 5 days of delay.
- **Data Persistence**: State is stored in `backend/data/mock_db.json` for the purpose of this demonstration.
- **Antigravity Role**: In this prototype, the "Antigravity Agent" is implemented as a structured reasoning service that simulates LLM-based logic for reliability in a demo environment.
