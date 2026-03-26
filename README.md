# 🚀 LeadOS MVP – Execution Guide

This document explains how to run the full LeadOS system (Frontend + Backend).

---

## 🧠 Project Overview

LeadOS is an AI-powered system that extracts business opportunities from online signals (currently Reddit).

It works by:

* Collecting raw user pain signals
* Processing them using an LLM
* Returning structured business opportunities in JSON

---

## 🧱 System Components

### 1. Frontend (Operator Dashboard)

* Built with React + Vite
* Displays agent outputs
* Triggers backend workflows

### 2. Backend (Core System)

* n8n (local workflow automation)
* Handles data collection + AI processing

---

## ⚙️ How to Run the Project

---

## 🔹 Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd leados-mvp
```

---

## 🔹 Step 2: Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Open in browser:

```
http://localhost:5173
```

---

## 🔹 Step 3: Setup Backend (n8n)

Install n8n:

```bash
npm install -g n8n
```

Start n8n:

```bash
npx n8n
```

Open:

```
http://localhost:5678
```

---

## 🔹 Step 4: Import Workflow

* Go to n8n dashboard
* Click **Import**
* Upload:

```
/n8n-workflows/reddit.json
```

---

## 🔹 Step 5: Set Up Credentials

### Groq API (Testing)

* Create credential → Bearer Auth
* Add your API key

---

## 🔄 Workflow Execution

### Pipeline

Webhook
↓
Reddit Fetch
↓
Groq API
↓
Edit Node (extract response)
↓
Edit Node (clean + parse JSON)
↓
Respond to Webhook

---

## 🔹 Step 6: Connect Frontend to Backend

* Ensure webhook URL from n8n is active
* Update frontend API call (if needed) in:

```
frontend/src/App.jsx
```

* Replace with your webhook URL

---

## 🔹 Step 7: Run the System

1. Start n8n
2. Start frontend
3. Click **Run Agent** on dashboard

---

## 📤 Expected Output

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

* `.env` is NOT pushed to GitHub
* Use `.env.example` as reference
* Add your own API keys locally

---

## 🔧 Updating Frontend (Important)

If modifying frontend:

### 1. DO NOT break API contract

Frontend expects:

```json
{
  "opportunities": [...]
}
```

If backend changes → frontend WILL break

---

### 2. Keep logic minimal

Frontend should:

* trigger agent
* display output

NOT:

* process AI data
* clean JSON
* apply logic

---

### 3. Always handle errors

Add:

* loading state
* error fallback
* empty response handling

---

### 4. Avoid hardcoding URLs

Use:

```js
const API_URL = "your-webhook-url";
```

Later move this to `.env`

---

### 5. Test after every change

* Click Run Agent
* Check console for errors
* Validate JSON rendering

---

## 🔧 Future Upgrade (Production)

* Replace Reddit → SerpAPI
* Replace Groq → Claude

Nodes already exist:

* `SerpAPI (PROD)`
* `Claude (PROD)`

---

## 🧠 System Behavior

Input:

* Raw Reddit posts

Processing:

* Pattern extraction via LLM

Output:

* Structured business opportunities

---

## ✅ Status

* End-to-end system working
* Frontend + backend connected
* Ready for iteration
