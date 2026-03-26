# LeadOS MVP 
# 🚀 LeadOS MVP – Execution Prompt (for Antigravity / AI Agents)

This document explains how to run and interact with the LeadOS MVP system.

---

## 🧠 Project Overview

LeadOS is an AI-powered pipeline that extracts business opportunities from online signals (currently Reddit) using an automated workflow built in n8n.

The system:

* Collects raw user pain signals
* Processes them using an LLM
* Outputs structured business opportunities in JSON format

---

## 🧱 System Components

### 1. Frontend (Optional)

* React + Vite Operator Dashboard
* Currently not required to run the pipeline

### 2. Backend (Core System)

* n8n (local workflow automation tool)

---

## ⚙️ How to Run the Project

### Step 1: Install n8n

```bash
npm install -g n8n
```

---

### Step 2: Start n8n

```bash
npx n8n
```

Open in browser:

```
http://localhost:5678
```

---

### Step 3: Import Workflow

* Go to n8n dashboard
* Click **Import**
* Upload:

```
/n8n-workflows/final_workflow_reddit.json
```

---

### Step 4: Set Up Credentials

#### 🔑 Groq API (for testing)

* Create new credential → **HTTP Header Auth**
* Add:

  * Authorization: Bearer YOUR_GROQ_API_KEY
  * Content-Type: application/json

---

## 🔄 Workflow Execution

### Pipeline Structure

```
Webhook
↓
Reddit Fetch (GET https://www.reddit.com/r/startups.json)
↓
Groq API (LLM processing)
↓
Edit Node (extract response)
↓
Edit Node (clean + parse JSON)
↓
Respond to Webhook
```

---

### Step 5: Run the Workflow

1. Open the workflow
2. Click **Execute Workflow**
3. Trigger Webhook (or use test URL)

---

## 📤 Expected Output

The system returns:

```json
{
  "opportunities": [
    {
      "service": "",
      "audience": "",
      "problem": ""
    }
  ]
}
```

---

## ⚠️ Important Notes

* Reddit is used as the primary signal source for testing (free and unlimited)
* Groq is used as the LLM to avoid token costs during development
* API keys are stored securely using n8n credentials (not inside workflow JSON)

---

## 🔧 Future Upgrade (Production Mode)

To switch to production:

* Replace **Reddit Fetch** with **SerpAPI**
* Replace **Groq API** with **Claude API**

Pre-created placeholder nodes:

* `SerpAPI (PROD)`
* `Claude (PROD)`

Connect these nodes and update credentials to activate production mode.

---

## 🧠 System Behavior

Input:

* Raw signal data (Reddit posts)

Processing:

* LLM extracts patterns and pain points

Output:

* Structured, machine-readable business opportunities

---

## ✅ Status

* End-to-end pipeline functional
* Ready for testing and iteration
* Easily extensible to other signal sources

---
