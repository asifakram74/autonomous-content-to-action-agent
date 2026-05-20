# Walkthrough: Antigravity Autonomous Logistics Agent

I have built a complete, end-to-end Agentic AI system for the Google Antigravity Hackathon. The system demonstrates how unstructured information can be transformed into autonomous logistics actions with robust security, multi-source ingestion, and platform parity.

## 🌟 Key Features
1. **Multi-Source Ingestion & Resolution**: Ingests raw news, spreadsheets, and databases concurrently. A credibility scorer filters stale datasets.
2. **Unified Operational Roles**: Implemented a secure and fully integrated permissions model separating **Operators** (can analyze stress signals, generate plans, and request execution authorizations) and **Directors** (hold bypass credentials to authorize and execute plans directly from both Web and Mobile).
3. **Traceable Agent Reasoning**: A step-by-step "Trace" shows the agent's logic (Insight → Impact → Action).
4. **Real-time Mobile Parity & Stepper Sync**: Added an interactive **Agent Console** tab to the Mobile Companion App with sequential progress tracking. When a Director clicks "Approve & Execute" on Mobile, the plan runs step-by-step, updating the shared DB so the Web Command Center animates progress simultaneously in real-time.
5. **Resilience & Safe Recovery**: Simulates real-time API failures on steps to trigger transactional database rollbacks.
6. **Constraint Enforcement**: Automatically intercepts actions (like emergency reorders) that exceed budget caps ($5,000) and safely adjusts them to comply.
7. **Secure Authentication Node**: Standard registration and SHA-256 secure authentication system added to both Web and Mobile, complete with dynamic role selection.
8. **Premium Design Parity**: A gorgeous dark-mode dashboard themed with neon glows, purple/amber role badges, and glassmorphism across both Web and Mobile App (`mobile/App.js`).

---

## 🔐 How to Access the Secure Login & Sign-Up Screen

Because you previously had a session token saved in your browser's local storage (`ag_token`), the dashboard automatically bypasses the login screen to keep your session uninterrupted. 

To view the stunning, secure sign-up and login pages:

### Option A: The "Sign Out" Flow
1. Look at the top right corner of the dashboard screen.
2. Click on the **Settings Gear Icon** (this acts as your User Profile Node).
3. The futuristic Profile Card will drop down.
4. Click the red **🚪 Sign Out** button. 
5. The system will instantly log you out, clear the session, and present the premium glassmorphic Authentication screen!

![Antigravity Secure Authentication Node](file:///C:/Users/zarmi/.gemini/antigravity/brain/d571551a-0e39-43b0-8c7a-cd45a3a5f6f4/antigravity_login_page_mockup_1779286627242.png)

### Option B: Clearing LocalStorage in Developer Console
1. Press `F12` or right-click and choose **Inspect** to open the developer tools.
2. Go to the **Console** tab.
3. Type `localStorage.clear()` and press `Enter`.
4. Refresh the page (`Ctrl + R`).

---

## 📺 Demonstration & UI Parity

### 1. Unified Web & Mobile Authentication
Users can register new credentials or log into existing profiles. The session token is securely persisted on both platforms. Mobile users can dynamically adjust the target Server IP to point to the active backend node in their environment.

### 2. Multi-Source Ingestion & Analysis
The agent processes conflicting data feeds (e.g. 500 units in Warehouse CSV vs 150 units in Real-Time Sales Database). It automatically resolved the conflict based on source credibility and timestamp age.

### 3. Action Execution & Rollback simulation
When an operator triggers a chained action:
- A success path dynamically changes inventory stock and diverts delayed shipments.
- A failure simulation triggers a complete transactional rollback, safely restoring data integrity.

## 🛠️ Tech Stack & Ports
- **Backend**: Express.js server running on port 5000.
- **Frontend**: Vite + React running on port 5174.
- **Mobile**: React Native App (`mobile/App.js`) matching the exact design palette.
- **Logic**: Antigravity Autonomous Agentic Workflow.

The system is fully integrated, verified, and running!
