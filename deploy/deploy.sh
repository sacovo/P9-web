#!/usr/bin/env bash
# Build the site and push it to the server, then reload the edge.
#
# Run from the repo root:  ./deploy/deploy.sh
#
# Everything this touches is under ~/p9 on the server. It never restarts the
# rover demo stack, so publishing a copy change cannot interrupt a running
# demonstration.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# The site's own hostname is also the box it is served from, so the target
# follows site.config.json like everything else rather than being a second
# place to edit when the zone moves. deploy/known_hosts pins its host key, so
# a changed name needs a refreshed pin too.
config_domain="$(node -p "require('./site.config.json').baseDomain")"
site_label="$(node -p "require('./site.config.json').labels.site")"

SERVER="${P9_SERVER:-debian@$site_label.$config_domain}"
REMOTE_DIR="${P9_REMOTE_DIR:-/home/debian/p9}"

# --- the two domain configs must agree, or links point at a dead zone -------
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
# --inplace matters: these are bind-mounted into containers as single files,
# and Docker binds them by inode. Without it rsync writes a new file and
# renames it over the old one, so the container goes on serving the inode it
# started with and the edit silently does nothing.
rsync -az --inplace deploy/Caddyfile deploy/docker-compose.yml \
  deploy/roverdemo.override.yml deploy/roverdemo.setup.yml \
  "$SERVER:$REMOTE_DIR/deploy/"

echo "==> Reloading the edge"
# `up -d` must succeed — CI reports this script's exit status, and a stack that
# failed to come up should not read as a green deploy. The reload after it is
# best-effort: `up -d` has already restarted Caddy if its config changed, so a
# failure here means there was nothing left to reload.
ssh "$SERVER" "cd $REMOTE_DIR/deploy && docker compose up -d && { docker compose exec -w /etc/caddy caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || echo '(no live reload; the stack was recreated instead)'; }"

echo "==> https://$site_label.$config_domain"
