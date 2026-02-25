#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# =============================================================================
# CONFIGURATION
# =============================================================================

DROPLET_IP="${1:-}"
DOMAIN="${2:-poker.prakashvenkat.com}"
SSH_USER="${3:-root}"

if [ -z "$DROPLET_IP" ]; then
    read -p "Droplet IP address: " DROPLET_IP
fi

if [ -z "$DROPLET_IP" ]; then
    error "Droplet IP is required"
fi

REMOTE="$SSH_USER@$DROPLET_IP"
REMOTE_DIR="/var/www/planning-poker"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_PORT=3000

log "Deploying to $REMOTE"
log "Domain: $DOMAIN"

# =============================================================================
# 1. TEST SSH CONNECTIVITY
# =============================================================================

log "Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$REMOTE" "echo 'SSH OK'" &>/dev/null; then
    error "Cannot connect to $REMOTE. Check your SSH key and droplet IP."
fi
log "SSH connection successful"

# =============================================================================
# 2. INSTALL NODE.JS 22 (IDEMPOTENT)
# =============================================================================

log "Checking Node.js installation..."
ssh "$REMOTE" 'node --version 2>/dev/null | grep -q "v22" || {
    echo "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y -qq nodejs
    echo "Node.js $(node --version) installed"
}'
log "Node.js ready"

# =============================================================================
# 3. INSTALL PM2 (IDEMPOTENT)
# =============================================================================

log "Checking PM2 installation..."
ssh "$REMOTE" 'command -v pm2 &>/dev/null || {
    echo "Installing PM2..."
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
    echo "PM2 installed"
}'
log "PM2 ready"

# =============================================================================
# 4. INSTALL CADDY (IDEMPOTENT)
# =============================================================================

log "Checking Caddy installation..."
ssh "$REMOTE" 'command -v caddy &>/dev/null || {
    echo "Installing Caddy..."
    apt-get update -qq
    apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null || true
    curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
    apt-get update -qq
    apt-get install -y -qq caddy
    systemctl enable caddy
    echo "Caddy installed"
}'
log "Caddy ready"

# =============================================================================
# 5. BUILD LOCALLY
# =============================================================================

log "Building locally..."
cd "$SCRIPT_DIR"
npm ci
npm run build
log "Build complete"

# =============================================================================
# 6. SYNC FILES TO DROPLET
# =============================================================================

log "Syncing files..."
ssh "$REMOTE" "mkdir -p $REMOTE_DIR"
rsync -avz --delete \
    "$SCRIPT_DIR/dist/" "$REMOTE:$REMOTE_DIR/dist/"
rsync -avz --delete \
    "$SCRIPT_DIR/dist-server/" "$REMOTE:$REMOTE_DIR/dist-server/"
rsync -avz \
    "$SCRIPT_DIR/package.json" "$SCRIPT_DIR/package-lock.json" \
    "$REMOTE:$REMOTE_DIR/"
log "Files synced to $REMOTE_DIR"

# =============================================================================
# 7. INSTALL PRODUCTION DEPENDENCIES ON REMOTE
# =============================================================================

log "Installing production dependencies..."
ssh "$REMOTE" "cd $REMOTE_DIR && npm ci --omit=dev"
log "Dependencies installed"

# =============================================================================
# 8. START/RESTART WITH PM2
# =============================================================================

log "Starting application with PM2..."
ssh "$REMOTE" "
    cd $REMOTE_DIR
    if pm2 describe planning-poker &>/dev/null; then
        pm2 restart planning-poker --update-env
        echo 'App restarted'
    else
        PORT=$APP_PORT pm2 start dist-server/index.js --name planning-poker
        echo 'App started'
    fi
    pm2 save
"
log "Application running"

# =============================================================================
# 9. MIGRATE CADDYFILE TO IMPORT-BASED LAYOUT (IDEMPOTENT)
# =============================================================================

log "Migrating Caddy to multi-site layout..."
ssh "$REMOTE" '
    mkdir -p /etc/caddy/sites

    # If the Caddyfile does NOT already use imports, migrate it
    if ! grep -q "^import /etc/caddy/sites/" /etc/caddy/Caddyfile 2>/dev/null; then
        # Preserve existing config (e.g. resume-blasteroid) as legacy.conf
        if [ -s /etc/caddy/Caddyfile ]; then
            cp /etc/caddy/Caddyfile /etc/caddy/sites/legacy.conf
            echo "Existing Caddyfile saved to /etc/caddy/sites/legacy.conf"
        fi
        echo "import /etc/caddy/sites/*" > /etc/caddy/Caddyfile
        echo "Caddyfile migrated to import-based layout"
    else
        echo "Caddyfile already uses import-based layout"
    fi
'
log "Caddy layout ready"

# =============================================================================
# 10. WRITE SITE CONFIG
# =============================================================================

log "Writing site config..."
ssh "$REMOTE" "cat > /etc/caddy/sites/poker.conf << 'EOF'
$DOMAIN {
    reverse_proxy localhost:$APP_PORT
}
EOF
echo 'poker.conf written'"
log "Site config ready"

# =============================================================================
# 11. RELOAD CADDY
# =============================================================================

log "Reloading Caddy..."
ssh "$REMOTE" "caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy"
log "Caddy reloaded"

# =============================================================================
# DONE
# =============================================================================

echo ""
log "Deployment complete!"
echo -e "  ${GREEN}→${NC} https://$DOMAIN"
echo ""
echo -e "${YELLOW}Note:${NC} Make sure your domain's DNS A record points to $DROPLET_IP"
echo -e "${YELLOW}Note:${NC} First HTTPS request may take a moment while Caddy obtains the SSL certificate"
echo -e "${YELLOW}Note:${NC} Re-deploying resume-blasteroid will overwrite the Caddyfile — update that workflow to use /etc/caddy/sites/ too"
