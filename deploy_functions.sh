#!/bin/bash
set -e

PROJECT_REF="wrybqqitsylqyhgzodyc"
SERVICE_ROLE="sb_secret_Hp8I24v0mrt-OZ82okzhcA_fpVkGcvB"
BASE_URL="https://api.supabase.com/v1/projects/$PROJECT_REF"

echo "=== Deploying Edge Functions ==="

# List functions to deploy
FUNCTIONSER_DIRS="health instagram-insights instagram-audience slots-available slots-manual-config slots-analysis instagram-media instagram-hashtags airtop-scrape buffer-profiles buffer-create instagram-publish ai-rota slots-next slots-claim generate-caption publish-buffer publish-instagram"

for fn in $_DIRS; do
  echo "Deploying $fn..."
  # We need to use supabase CLI or Management API with PAT
  # For now, just show what would be deployed
  echo "  → supabase/functions/$fn/index.ts"
done

echo "=== Running pg_cron SQL ==="
echo "  → supabase/pg_cron_setup.sql"

echo "=== Creating bucket galeria-images ==="
echo "  → Storage API"

echo "=== Setting secrets ==="
echo "  → BUFFER_ACCESS_TOKEN, ROUTER_PROXY_URL, AIRTOP_API_KEY"
