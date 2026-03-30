#!/bin/sh
set -e

echo "=== LeadOS n8n Startup ==="

# 1. Replace Calendly token placeholder in workflow files
if [ -n "$CALENDLY_TOKEN" ]; then
  echo "Injecting Calendly token..."
  sed -i "s/__CALENDLY_TOKEN__/${CALENDLY_TOKEN}/g" /home/node/workflows/*.json
fi

# 2. Strip hardcoded credential IDs so n8n matches by name
echo "Preparing workflows for portable import..."
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
    } catch(e) { console.log('Skip: $f'); }
  "
done

# 3. Import all workflows (they start deactivated)
echo "Importing workflows..."
for f in /home/node/workflows/*.json; do
  echo "  Importing: $(basename $f)"
  n8n import:workflow --input="$f" 2>&1 || echo "  WARNING: Failed to import $f"
done

# 4. Start n8n in background
echo "Starting n8n..."
n8n start &
N8N_PID=$!

# 5. Wait for n8n to be ready
echo "Waiting for n8n to become ready..."
RETRIES=0
until curl -sf http://localhost:5678/healthz > /dev/null 2>&1; do
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -gt 60 ]; then
    echo "ERROR: n8n did not start within 120 seconds"
    exit 1
  fi
  sleep 2
done
echo "n8n is ready!"

# 6. Create credentials via REST API
echo "Creating credentials..."

# Groq credential (Header Auth account)
if [ -n "$GROQ_API_KEY" ]; then
  curl -sf -X POST "http://localhost:5678/api/v1/credentials" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Header Auth account\",
      \"type\": \"httpHeaderAuth\",
      \"data\": {\"name\": \"Authorization\", \"value\": \"Bearer ${GROQ_API_KEY}\"}
    }" > /dev/null 2>&1 && echo "  Created: Groq credential" || echo "  WARNING: Groq credential may already exist"
fi

# HubSpot credential (Header Auth hubspot)
if [ -n "$HUBSPOT_API_KEY" ]; then
  curl -sf -X POST "http://localhost:5678/api/v1/credentials" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Header Auth hubspot\",
      \"type\": \"httpHeaderAuth\",
      \"data\": {\"name\": \"Authorization\", \"value\": \"Bearer ${HUBSPOT_API_KEY}\"}
    }" > /dev/null 2>&1 && echo "  Created: HubSpot credential" || echo "  WARNING: HubSpot credential may already exist"
fi

# 7. Activate all workflows
echo "Activating workflows..."
WORKFLOW_IDS=$(curl -sf "http://localhost:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{JSON.parse(d).data.forEach(w=>console.log(w.id))}catch(e){console.error('Failed to parse workflows')}})")

for WID in $WORKFLOW_IDS; do
  curl -sf -X PATCH "http://localhost:5678/api/v1/workflows/$WID" \
    -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"active": true}' > /dev/null 2>&1 && echo "  Activated: $WID" || echo "  WARNING: Failed to activate $WID"
done

echo "=== LeadOS n8n ready! ==="
echo "Workflows imported and activated. Webhooks are live."

# 8. Keep container alive
wait $N8N_PID
