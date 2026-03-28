# LeadOS Handover & Context Instruction

This document preserves the state of the LeadOS Autonomous Revenue Pipeline for continuation after system updates.

## 🚀 Project Overview
**LeadOS** is an autonomous revenue system that transforms market signals (Step 1) into validated offers (Step 2), blueprints (Step 4), multi-channel messaging (Step 5), paid traffic plans (Step 6), and outbound outreach simulation (Step 7).

## 🏗️ Technical Architecture
- **Frontend**: React (Vite) + Tailwind CSS.
- **Backend**: n8n local server ([http://localhost:5678](http://localhost:5678)).
- **LLM**: Groq (Llama 3.1 8B/70B) via HTTP Request nodes.

## 🛠️ Pipeline State (Current)

### 1. Market Intelligence (Agent 1)
- Scans Reddit/Social for pain points.
- **Note**: Triggers a full pipeline reset upon restart (clears all downstream state).

### 2. Opportunity Engineering (Agent 2)
- Generates 3 unique business offers.
- **Critical Fix**: Added a "Retry Alpha Engine" button on individual cards to recover from JSON parsing/timeout errors without refreshing the page.

### 3. Systematic Decision Node (Agent 3)
- **Hackathon Logic**: Pathological "Forced Winner" mode enabled.
- **Rules**: Must always select exactly one winner and return `final_decision: "GO"`. This prevents the "Revise" loop that was causing rate-limit errors from Agent 1.

### 4. GTM Blueprint (Agent 4)
- Generates landing page hooks, headlines, and conversion flows for the winning offer.
- **Endpoint**: `/webhook/agent4-funnel`.

### 5. Narrative Builder (Agent 5)
- Converts funnel data into LinkedIn posts, Cold DMs, and Email sequences.
- **Endpoint**: `/webhook/agent5-narrative`.
- **UI**: Live in Step 5.

### 6. Paid Traffic Agent (Agent 6 – Live)
- **Status**: n8n workflow + frontend UI fully integrated.
- **Function**: Calculates CPC, CTR, CPL, and channel allocation.
- **Endpoint**: `/webhook/agent6-paid-traffic`.
- **UI**: Step 6 — unlocked after Step 5 narrative is generated.

### 7. Outbound Outreach Simulation (Agent 7 – Live)
- **Status**: n8n workflow + frontend UI fully integrated.
- **Function**: Simulates ICP targeting, prospect mapping, outreach sequence, message variants, volume plan.
- **Endpoint**: `/webhook/agent7-outbound`.
- **UI**: Step 7 — unlocked after Step 6 paid traffic is generated.
- **Model**: Llama 3.1 70B (higher quality for prospect simulation accuracy).

## 🔧 Critical Implementation Details
- **State Reset**: `runAgent1` clears `opportunities`, `funnelData`, `narrativeData`, `trafficData`, and `outboundData` to ensure zero state-bleeding.
- **Error Handling**: Agent 2 uses robust `.text()` parsing to catch empty AI responses before trial-parsing JSON.
- **UI Flow**: Vertical pipeline flow. Each step unlocks only when the previous step is complete.
- **Pipeline unlock chain**: Agent 5 → unlocks Agent 6 → unlocks Agent 7.

## 🔜 Next Steps for Frontend Work
1. **Agent 8+**: Autonomous execution layer (real email/DM sending via integrations like Instantly, Apollo, or Lemlist).
2. **Export functionality**: Allow users to download the full pipeline output as a PDF/report.
3. **Session persistence**: Save pipeline state to localStorage so a page refresh doesn't lose data.

## 🔑 Access Info
- **n8n Link**: [http://localhost:5678](http://localhost:5678)
- **Frontend**: [http://localhost:5173](http://localhost:5173) (Vite port)
- **Core Logic**: `frontend/src/App.jsx`.
- **Workflows**: `n8n-workflows/`
  - `Agent1_market.json` – Market intelligence
  - `Agent2_offer.json` – Offer engineering
  - `Agent3_selection.json` – Decision node
  - `Agent4_funnel.json` – GTM blueprint
  - `Agent5_narrative.json` – Narrative builder
  - `Agent6_paid_traffic.json` – Paid traffic
  - `Agent7_outbound.json` – Outbound simulation *(NEW)*

## ⚡ How to Start
1. `npx n8n start` – in project root
2. `npm run dev` – in `frontend/`
3. Import all workflows from `n8n-workflows/` into n8n and activate them
