# LeadOS: Autonomous Revenue Pipeline Documentation

## System Overview
LeadOS is an end-to-end autonomous revenue engine that simulates the entire lifecycle of a B2B business—from market intelligence and offer creation to lead qualification and financial attribution. The system is powered by a sequence of **11 specialized AI Agents** orchestrated via **n8n** and a **React/Vite** frontend.

---

## Technical Stack
- **Frontend**: React (Vite) + TailwindCSS (Glassmorphic Design)
- **Workflow Automation**: n8n (Local server: `http://localhost:5678`)
- **LLM**: Groq (Llama 3.1 8B Instant / 70B Versatile)
- **State Management**: Sequential pipeline unlocking with defensive JSON parsing.

---

## Agent-by-Agent Breakdown

### 1. Agent 1: Market Intelligence (Discovery)
- **Purpose**: Scans market signals (Reddit, search, or simulated trends) to identify high-intent business opportunities.
- **Output**: A list of "Market Opportunities" with identified pain points, audience sub-segments, and suggested solutions.

### 2. Agent 2: Offer Strategy
- **Purpose**: Translates a market opportunity into a high-ticket B2B offer.
- **Output**: Structured offer including Problem, Promise, Pricing, and ICP (Ideal Customer Profile) details.

### 3. Agent 3: Selection (Validation)
- **Purpose**: Evaluates the feasibility and profitability of the generated offers to select the "Winner" for execution.
- **Output**: Validation report and a trigger for the downstream execution pipeline.

### 4. Agent 4: Funnel Architect
- **Purpose**: Designs the technical and psychological acquisition funnel for the validated offer.
- **Output**: Landing page copy (Headline, Subheadline, CTA), Lead Magnet details, and a 7-day execution plan.

### 5. Agent 5: Messaging & Narrative
- **Purpose**: Generates the underlying marketing narrative and multi-channel messaging assets.
- **Output**: Core market positioning, messaging angles (Pain/Outcome/Benefit), and ready-to-use assets (LinkedIn posts, Email sequences, Cold DMs).

### 6. Agent 6: Paid Traffic
- **Purpose**: Simulates a paid acquisition strategy across Google, LinkedIn, and Meta.
- **Logic**: Uses causal math (`expected_clicks = budget / cpc`) to derive performance.
- **Output**: Channel-level budget allocation, CPC, CTR, and projected lead volume.

### 7. Agent 7: Outbound Outreach
- **Purpose**: Simulates an outbound prospecting engine (LinkedIn/Cold Email).
- **Logic**: Derives metrics based on daily contact volume and simulated response rates.
- **Output**: Targeting criteria, sample prospect personas, and projected meeting volume.

### 8. Agent 8: Inbound Lead Capture
- **Purpose**: Converts anonymous traffic and outbound engagement into structured "Lead Objects".
- **Logic**: Implements a Lead Scoring Formula: `(ICP*0.4) + (intent*0.3) + (pain*0.2) + (budget*0.1)`.
- **Output**: A list of leads with attributes (lead_score, intent_level, ICP_match).

### 9. Agent 9: AI Qualification Simulator (BANT)
- **Purpose**: Simulates AI voice/chat calls to qualify leads using the BANT framework (Budget, Authority, Need, Timeline).
- **Output**: Personalized call scripts, simulated lead responses, and a BANT-qualification report.

### 10. Agent 10: Sales Routing Engine
- **Purpose**: Deterministic decision engine that assigns leads to the appropriate next step.
- **Logic**: Computes a `composite_intent_score` (Qual 50% / Behaviour 30% / Transcript 20%).
- **Output**: Final routing decision (CHECKOUT, SALES_CALL, NURTURE, DISQUALIFIED) and CRM stage update.

### 11. Agent 11: Tracking & Attribution Engine
- **Purpose**: The "System of Truth" that attributes revenue potential to original marketing sources.
- **Output**: UTM mapping per lead, funnel waterfall (Visitors -> Leads -> Bookings -> Sales), and channel-level ROI/CPL metrics.

---

## The Pipeline Flow
1. **Intelligence Phase** (Agents 1-3): Move from raw market data to a validated business offer.
2. **Strategy Phase** (Agents 4-5): Build the funnel and the messaging narrative.
3. **Acquisition Phase** (Agents 6-8): Simulate paid and outbound traffic flows to generate leads.
4. **Qualification Phase** (Agents 9-11): Run leads through AI simulations, route them to checkout/sales, and attribute all data back to the source.

---

## Operational Instructions
1. **Workflows**: All workflows are located in the `/n8n-workflows` directory.
2. **Importing**: After any system update, import the latest `.json` files into your local n8n instance and ensure they are **Active**.
3. **Execution**: The frontend is sequential. You must run each step to unlock the next, ensuring data integrity is maintained through the `localStorage` or pipeline state.
