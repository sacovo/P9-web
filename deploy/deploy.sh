#!/usr/bin/env bash
# Build the site and push it to the server, then reload the edge.
#
# Run from the repo root:  ./deploy/deploy.sh
#
# Everything this touches is under ~/p9 on the server. It never restarts the
# rover demo stack, so publishing a copy change cannot interrupt a running
# demonstration.
set -euo pipefail

SERVER="${P9_SERVER:-debian@195.15.197.209}"
REMOTE_DIR="${P9_REMOTE_DIR:-/home/debian/p9}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"

# --- the two domain configs must agree, or links point at a dead zone -------
config_domain="$(node -p "require('./site.config.json').baseDomain")"
if [[ -f deploy/.env ]]; then
  env_domain="$(grep -E '^BASE_DOMAIN=' deploy/.env | cut -d= -f2-)"
  if [[ "$config_domain" != "$env_domain" ]]; then
    echo "BASE_DOMAIN disagrees:" >&2
    echo "  site.config.json : $config_domain" >&2
    echo "  deploy/.env      : $env_domain" >&2
    echo "Fix both before deploying — the site would link to one and serve the other." >&2
    exit 1
  fi
fi

echo "==> Building (domain: $config_domain)"
npm run build

echo "==> Syncing to $SERVER:$REMOTE_DIR"
ssh "$SERVER" "mkdir -p $REMOTE_DIR/deploy/site $REMOTE_DIR/deploy/recap"

# --delete so removed pages actually disappear; the PDF is large but rsync
# only ships it when it changes.
rsync -az --delete dist/ "$SERVER:$REMOTE_DIR/deploy/site/"
rsync -az deploy/Caddyfile deploy/docker-compose.yml deploy/roverdemo.override.yml \
  "$SERVER:$REMOTE_DIR/deploy/"

echo "==> Reloading the edge"
ssh "$SERVER" "cd $REMOTE_DIR/deploy && docker compose up -d && docker compose exec -w /etc/caddy caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || true"

site_label="$(node -p "require('./site.config.json').labels.site")"
echo "==> https://$site_label.$config_domain"
