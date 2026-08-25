#!/usr/bin/env bash
# One-time server preparation. Run on the server:  bash bootstrap.sh
#
# Idempotent — safe to re-run.
set -euo pipefail

REMOTE_DIR="${REMOTE_DIR:-/home/debian/p9}"

# --- swap ------------------------------------------------------------------
# This box has 3 GB of RAM and will run two n8n instances plus a ROS 2
# container. That fits, but with little headroom: a build or a burst of
# workflow executions can push it over, and the OOM killer takes whichever
# process is largest rather than whichever is least important. Swap turns a
# kill into slowness.
if ! /sbin/swapon --show | grep -q .; then
  echo "==> Creating 2G swap"
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  # Prefer reclaiming cache over swapping; this is a latency-sensitive demo.
  echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf >/dev/null
  sudo sysctl -q -p /etc/sysctl.d/99-swappiness.conf
else
  echo "==> Swap already present"
fi

# --- docker log growth -----------------------------------------------------
# A demo left running for months otherwise fills the disk with JSON logs.
if [[ ! -f /etc/docker/daemon.json ]]; then
  echo "==> Capping container log size"
  sudo mkdir -p /etc/docker
  echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' \
    | sudo tee /etc/docker/daemon.json >/dev/null
  sudo systemctl restart docker
fi

mkdir -p "$REMOTE_DIR/deploy/site" "$REMOTE_DIR/deploy/recap"

echo
echo "Ready. Remaining manual steps:"
echo "  1. Clone the demo repo:"
echo "       git clone <n8n-nodes-ros2> $REMOTE_DIR/n8n-nodes-ros2"
echo "  2. Configure and start the rover stack under project name 'roverdemo',"
echo "     WITHOUT its own caddy (this deployment provides the edge):"
echo "       cd $REMOTE_DIR/n8n-nodes-ros2/demo"
echo "       cp .env.example .env    # set N8N_ENCRYPTION_KEY, domains"
echo "       docker compose -p roverdemo \\"
echo "         -f docker-compose.yml -f $REMOTE_DIR/deploy/roverdemo.override.yml \\"
echo "         up -d --build n8n ros2"
echo "  3. Create the n8n owner account through an SSH tunnel BEFORE the"
echo "     editor is publicly reachable — an unclaimed n8n can be claimed by"
echo "     whoever gets there first, and the Code node then runs as them:"
echo "       ssh -L 5678:localhost:5678 <server>   # then open localhost:5678"
echo "  4. From your workstation: ./deploy/deploy.sh"
