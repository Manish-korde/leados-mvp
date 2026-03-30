#!/bin/sh

# Railway injects PORT env var — n8n must listen on it
export N8N_PORT="${PORT:-5678}"
echo "Starting n8n on port $N8N_PORT"

# Start n8n directly (no delays)
exec n8n start
