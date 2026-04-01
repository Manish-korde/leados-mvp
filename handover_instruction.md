# LeadOS — Complete Setup & Handover Guide

LeadOS is a **13-agent autonomous B2B lead generation pipeline**. It scans Reddit for business pain points, generates validated offers, builds funnels, creates messaging, simulates paid/outbound traffic, captures leads, qualifies them with AI calls (BANT), routes to sales, and tracks full-funnel attribution — all without human intervention.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + Vite 8 + TailwindCSS v4 | **Requires Node.js 22+** |
| Backend | n8n (self-hosted) | Workflow automation on localhost:5678 |
| LLM | Groq API (llama-3.1-8b-instant) | Free tier, 30 req/min rate limit |
| CRM | HubSpot | Free tier, private app token |
| Calendar | Calendly | Booking links for qualified leads |
| Email | SendGrid | Free tier (100 emails/day) |
| Notifications | Slack | Incoming webhooks |

---

## Prerequisites

Install these before starting:

- **Node.js 22+** — required by Vite 8 + TailwindCSS v4 ([download](https://nodejs.org))
- **npm** — comes with Node.js
- **n8n** — install globally: `npm install -g n8n`
- **Git** — to clone the repo

---

## Quick Start (Step by Step)

### 1. Clone the Repository

```bash
git clone https://github.com/Manish-korde/leados-mvp.git
cd leados-mvp
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and fill in your API keys (see "API Keys Setup" section below).

### 4. Start n8n

```bash
npx n8n start
```

n8n opens at `http://localhost:5678`. On first launch, create an owner account.

### 5. Import ALL Workflows into n8n

In n8n UI:
1. Click **Add Workflow** (top right)
2. Click **...** menu -> **Import from File**
3. Import each file from `n8n-workflows/` one at a time:

| File | Agent | What It Does |
|------|-------|-------------|
| `reddit.json` | Agent 1 | Market intelligence (Reddit scraping) |
| `Agent2_offer.json` | Agent 2 | Offer engineering with validation loop |
| `Agent3_selection.json` | Agent 3 | Selection engine (picks winner) |
| `Agent4_funnel.json` | Agent 4 | Funnel architect (landing page, lead magnet) |
| `Agent5_narrative.json` | Agent 5 | Messaging & narrative (LinkedIn, email, DMs) |
| `Agent6_paid_traffic.json` | Agent 6 | Paid traffic simulation (Google, LinkedIn, Meta) |
| `Agent7_outbound.json` | Agent 7 | Outbound outreach + **SendGrid email** |
| `Agent8_inbound_capture.json` | Agent 8 | Lead capture + **Slack notification** |
| `Agent9_qualification.json` | Agent 9 | BANT qualification + **SendGrid + Slack** |
| `Agent10_sales_routing.json` | Agent 10 | Sales routing + **SendGrid + Slack** |
| `Agent11_tracking_attribution.json` | Agent 11 | Attribution & tracking engine |
| `Agent12_performance.json` | Agent 12 | Performance optimization |
| `Agent13_crm_hygiene.json` | Agent 13 | CRM hygiene + **SendGrid report** |

### 6. Set Up n8n Credentials (MANUAL — You Must Do This)

Go to **n8n -> Settings (gear icon) -> Credentials -> Add Credential -> Header Auth**

Create these 3 credentials:

#### Credential 1: Groq API (REQUIRED)

| Field | Value |
|-------|-------|
| Name | `Header Auth account` |
| Header Name | `Authorization` |
| Header Value | `Bearer gsk_YOUR_GROQ_API_KEY` |

#### Credential 2: HubSpot (REQUIRED)

| Field | Value |
|-------|-------|
| Name | `Header Auth hubspot` |
| Header Name | `Authorization` |
| Header Value | `Bearer pat-na2-YOUR_HUBSPOT_TOKEN` |

#### Credential 3: SendGrid (OPTIONAL — for email features)

| Field | Value |
|-------|-------|
| Name | `SendGrid API` |
| Header Name | `Authorization` |
| Header Value | `Bearer SG.YOUR_SENDGRID_API_KEY` |

**IMPORTANT**: After importing workflows, open each SendGrid node (Agents 7, 9, 10, 13) and manually select the "SendGrid API" credential from the dropdown. The imported JSON has a placeholder credential ID that won't match your n8n instance.

### 7. Configure Slack Webhook (OPTIONAL)

For Slack notifications in Agents 8, 9, 10:
1. Create a Slack app at https://api.slack.com/apps
2. Add an Incoming Webhook and copy the URL
3. In n8n, open the Slack nodes in Agents 8, 9, 10
4. Replace the placeholder URL `https://hooks.slack.com/services/REPLACE_WITH_YOUR_WEBHOOK` with your real webhook URL

### 8. Activate All Workflows

Toggle each imported workflow to **Active** (green toggle, top right of each workflow).

### 9. Start Frontend

```bash
cd frontend
npm run dev
```

### 10. Open Browser

Go to `http://localhost:5173` — Click **SCAN MARKET INTEL** to start the pipeline.

---

## API Keys Setup — Where to Get Them

### Groq API (REQUIRED — Free)

1. Go to https://console.groq.com
2. Sign up / Sign in
3. Go to API Keys -> Create API Key
4. Copy the key (starts with `gsk_`)
5. Add to `.env` as `GROQ_API_KEY=gsk_...`

### HubSpot (REQUIRED — Free)

1. Go to https://app.hubspot.com
2. Create a free account
3. Go to Settings -> Integrations -> Private Apps
4. Create a new private app named "LeadOS Integration"
5. Under Scopes, add: `crm.objects.contacts.read`, `crm.objects.contacts.write`, `crm.objects.deals.read`
6. Create app -> Copy the access token (starts with `pat-na2-`)
7. Add to `.env` as `HUBSPOT_PRIVATE_APP_TOKEN=pat-na2-...`

### Calendly (OPTIONAL)

1. Go to https://calendly.com/integrations/api_webhooks
2. Generate a Personal Access Token
3. Used by Agent 10 for booking links
4. Add to `.env` as `CALENDLY_API_TOKEN=...`

### SendGrid (OPTIONAL — Free)

1. Go to https://signup.sendgrid.com
2. Create account (free = 100 emails/day)
3. Go to Settings -> Sender Authentication -> Verify a sender email
4. Go to Settings -> API Keys -> Create API Key (Full Access)
5. Copy the key (starts with `SG.`)
6. Add to `.env` as `SENDGRID_API_KEY=SG....`
7. **IMPORTANT**: The "from" email in workflow nodes must match your verified sender

### Slack (OPTIONAL — Free)

1. Go to https://api.slack.com/apps -> Create New App
2. Choose "From scratch", name it "LeadOS Bot"
3. Go to Incoming Webhooks -> Activate
4. Add New Webhook to Workspace -> Select a channel
5. Copy the webhook URL
6. Add to `.env` as `SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...`

---

## Pipeline Flow

```
Phase 1: INTELLIGENCE          Phase 2: STRATEGY
Agent 1 (Reddit Scan)          Agent 4 (Funnel Architect)
    |                              |
Agent 2 (Offer Engineering)    Agent 5 (Messaging & Narrative)
    |
Agent 3 (Selection/Validation)

Phase 3: ACQUISITION           Phase 4: QUALIFICATION
Agent 6 (Paid Traffic)         Agent 9 (BANT Qualification)
    |                              |
Agent 7 (Outbound + Email)    Agent 10 (Sales Routing + Email)
    |                              |
Agent 8 (Lead Capture + Slack) Agent 11 (Attribution)

Phase 5: OPERATIONS
Agent 12 (Performance Dashboard)
    |
Agent 13 (CRM Hygiene + Email Report)
```

### Webhook Endpoints

| Agent | Endpoint | Method |
|-------|----------|--------|
| 1 | `/webhook/agent1` | POST |
| 2 | `/webhook/agent2-offer` | POST |
| 3 | `/webhook/agent3-selection` | POST |
| 4 | `/webhook/agent4-funnel` | POST |
| 5 | `/webhook/agent5-narrative` | POST |
| 6 | `/webhook/agent6-paid-traffic` | POST |
| 7 | `/webhook/agent7-outbound` | POST |
| 8 | `/webhook/agent8-inbound-capture` | POST |
| 9 | `/webhook/agent9-qualification` | POST |
| 10 | `/webhook/agent10-sales-routing` | POST |
| 11 | `/webhook/agent11-tracking-attribution` | POST |
| 12 | `/webhook/agent12-performance` | POST |
| 13 | `/webhook/agent13-crm-hygiene` | POST |

---

## Frontend Features

- **Dashboard Tab**: 13-step sequential pipeline with glassmorphic dark UI
- **Timeline Tab**: SPARC-inspired workflow progress view (great for demos — shows real-time agent status)
- **Floating Nav Bar**: Shows all 13 agents, highlights current section while scrolling
- **Ad Mockups**: Agent 6 generates SVG-based ad previews per channel (LinkedIn blue, Google search format, Meta gradient)
- **Back-to-Top Button**: Fixed bottom-right corner

---

## Known Issues & Workarounds

| Issue | Cause | Fix |
|-------|-------|-----|
| Agent 1 returns empty | Reddit IP-blocked your network | Wait 15-30 min. Fallback data kicks in automatically |
| Slack shows all zeros | Old workflow version with string parsing bug | Re-import latest workflow JSONs from repo |
| SendGrid no emails sent | Credential not linked / sender not verified | Select "SendGrid API" credential in each SendGrid node + verify sender in SendGrid dashboard |
| Frontend has no styles | Node.js version too old | Install Node 22+ (TailwindCSS v4 requirement) |
| HubSpot 0 API calls | Header Name field wrong | Must be `Authorization`, not `Auth-hubspot` |
| Rate limit errors | Groq allows 30 req/min | Wait 30-60 seconds between agent triggers |
| ICP renders as [object] | Groq returned object instead of string | Already fixed in code (typeof check) |

---

## Deployment (Optional)

### Frontend on Render.com (Free)

The `render.yaml` is pre-configured:
1. Push to GitHub
2. Go to https://render.com -> New -> Blueprint
3. Connect your repo -> Deploy
4. Frontend deploys as free static site

### n8n Backend (Docker)

`Dockerfile.n8n` and `n8n-start.sh` are included for containerized deployment on Railway, Koyeb, or any Docker host. Free tiers are limited — for hackathon demo, run n8n locally.

---

## File Structure

```
leados-mvp/
  frontend/
    src/
      App.jsx          <- ALL UI code lives here (single file)
      index.css        <- TailwindCSS + Inter font
      main.jsx         <- React entry point
    index.html         <- Vite entry + Google Fonts
    package.json       <- Node 22+ required
    vite.config.js     <- Dev server proxy config
  n8n-workflows/
    reddit.json        <- Agent 1: Market Intelligence
    Agent2_offer.json  <- Agent 2: Offer Engineering
    Agent3_selection.json
    Agent4_funnel.json
    Agent5_narrative.json
    Agent6_paid_traffic.json
    Agent7_outbound.json    <- + SendGrid integration
    Agent8_inbound_capture.json  <- + Slack integration
    Agent9_qualification.json    <- + SendGrid + Slack
    Agent10_sales_routing.json   <- + SendGrid + Slack
    Agent11_tracking_attribution.json
    Agent12_performance.json
    Agent13_crm_hygiene.json     <- + SendGrid integration
  .env.example         <- Template with all required variables
  .gitignore
  Dockerfile.n8n       <- Docker config for n8n deployment
  n8n-start.sh         <- Startup script for containerized n8n
  render.yaml          <- Render.com deployment config
  railway.toml         <- Railway.app deployment config
  LEADOS_SYSTEM_DOCUMENTATION.md  <- Technical deep-dive
  PRESENTATION_SCRIPT.md          <- Hackathon demo script
  handover_instruction.md         <- This file
```

---

## Troubleshooting Checklist

If the pipeline isn't working, check these in order:

1. **Is n8n running?** `http://localhost:5678` should load
2. **Are all 13 workflows imported AND active?** Check each has green toggle
3. **Is the Groq credential working?** Open any agent -> click the Groq node -> Test Step
4. **Is the frontend running?** `http://localhost:5173` should load
5. **Check browser console** (F12) for fetch errors
6. **Check n8n execution logs** for each workflow (click workflow -> Executions tab)

---

## Demo Tips

- Use the **Timeline tab** to stall time between agents (explains what each agent does while waiting for rate limits)
- **Don't spam Agent 1** — Reddit will block your IP. One trigger, then wait for the full pipeline
- The **Presentation Script** (`PRESENTATION_SCRIPT.md`) has a complete 15-20 minute demo script with judge Q&A answers
