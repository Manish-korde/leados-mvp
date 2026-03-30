#!/bin/sh

echo "=== LeadOS n8n Startup ==="

# Railway injects PORT env var — n8n must listen on it
export N8N_PORT="${PORT:-5678}"
echo "Listening on port: $N8N_PORT"

# Start n8n IMMEDIATELY in background (so healthcheck passes fast)
n8n start &
N8N_PID=$!

# Wait for n8n to be ready before doing any setup
echo "Waiting for n8n to be ready..."
RETRIES=0
until curl -sf "http://localhost:${N8N_PORT}/healthz" > /dev/null 2>&1; do
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -gt 120 ]; then
    echo "ERROR: n8n did not start within 240 seconds"
    break
  fi
  sleep 2
done
echo "n8n is ready!"

# 1. Replace Calendly token placeholder
if [ -n "$CALENDLY_TOKEN" ]; then
  echo "Injecting Calendly token..."
  sed -i "s/__CALENDLY_TOKEN__/${CALENDLY_TOKEN}/g" /home/node/workflows/*.json
fi

# 2. Strip hardcoded credential IDs
echo "Preparing workflows..."
for f in /home/node/workflows/*.json; do
  node -e "
    const fs = require('fs');
    try {
      const wf = JSON.parse(fs.readFileSync('$f','utf8'));
      (wf.nodes || []).forEach(n => {
        if (n.credentials) {
          Object.values(n.credentials).forEach(c => { delete c.id; });
        }
      });
      fs.writeFileSync('$f', JSON.stringify(wf, null, 2));
    } catch(e) {}
  "
done

# 3. Import workflows via REST API (n8n is already running)
if [ -n "$N8N_API_KEY" ]; then
  echo "Importing workflows..."
  for f in /home/node/workflows/*.json; do
    WORKFLOW_JSON=$(cat "$f")
    curl -sf -X POST "http://localhost:${N8N_PORT}/api/v1/workflows" \
      -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
      -H "Content-Type: application/json" \
      -d "$WORKFLOW_JSON" > /dev/null 2>&1 && echo "  Imported: $(basename $f)" || echo "  Skip: $(basename $f)"
  done

  # 4. Create credentials
  echo "Creating credentials..."
  if [ -n "$GROQ_API_KEY" ]; then
    curl -sf -X POST "http://localhost:${N8N_PORT}/api/v1/credentials" \
      -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Header Auth account\",\"type\":\"httpHeaderAuth\",\"data\":{\"name\":\"Authorization\",\"value\":\"Bearer ${GROQ_API_KEY}\"}}" \
      > /dev/null 2>&1 && echo "  Created: Groq" || echo "  Skip: Groq"
  fi
  if [ -n "$HUBSPOT_API_KEY" ]; then
    curl -sf -X POST "http://localhost:${N8N_PORT}/api/v1/credentials" \
      -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Header Auth hubspot\",\"type\":\"httpHeaderAuth\",\"data\":{\"name\":\"Authorization\",\"value\":\"Bearer ${HUBSPOT_API_KEY}\"}}" \
      > /dev/null 2>&1 && echo "  Created: HubSpot" || echo "  Skip: HubSpot"
  fi

  # 5. Activate all workflows
  echo "Activating workflows..."
  WORKFLOW_IDS=$(curl -sf "http://localhost:${N8N_PORT}/api/v1/workflows" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" | \
    node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{JSON.parse(d).data.forEach(w=>console.log(w.id))}catch(e){}})" 2>/dev/null)
  for WID in $WORKFLOW_IDS; do
    curl -sf -X PATCH "http://localhost:${N8N_PORT}/api/v1/workflows/$WID" \
      -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
      -H "Content-Type: application/json" \
      -d '{"active":true}' > /dev/null 2>&1 && echo "  Activated: $WID" || true
  done
fi

echo "=== LeadOS n8n fully configured! ==="

# Keep container alive
wait $N8N_PID
