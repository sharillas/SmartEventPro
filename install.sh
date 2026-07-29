#!/bin/bash

# =============================================
#  SmartEventManager - Instalação VPS Debian/Ubuntu
#  MVPS.net ou qualquer VPS Ubuntu 22.04+ / Debian 12+
# =============================================

set -e

APP_DIR="/opt/smartevent"
DOMAIN=""
NODE_VERSION="22"

echo "========================================"
echo " SmartEventManager - Instalador Automático"
echo "========================================"
echo ""

# ---- Pedir domínio ----
if [ -z "$DOMAIN" ]; then
  read -p "Domínio (ex: app.smartchoice.pt): " DOMAIN
fi

# ---- Atualizar sistema ----
echo ""
echo "[1/8] A atualizar sistema..."
apt update -y && apt upgrade -y

# ---- Instalar dependências ----
echo "[2/8] A instalar dependências..."
apt install -y curl git nginx certbot python3-certbot-nginx ufw

# ---- Instalar Node.js ----
echo "[3/8] A instalar Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt install -y nodejs
fi
echo "Node.js $(node -v) | npm $(npm -v)"

# ---- Instalar PM2 ----
echo "[4/8] A instalar PM2..."
npm install -g pm2

# ---- Criar diretório da app ----
echo "[5/8] A criar diretório da aplicação..."
mkdir -p $APP_DIR
cd $APP_DIR

# ---- Clonar repositório (se fornecido) ----
if [ -d ".git" ]; then
  echo "  Repositório já existe, a atualizar..."
  git pull origin main
else
  echo "  A clonar repositório..."
  read -p "URL do repositório GitHub: " REPO_URL
  git clone "$REPO_URL" .
fi

# ---- Instalar dependências npm ----
echo "[6/8] A instalar dependências npm..."
npm install

# ---- Configurar ambiente ----
echo "[7/8] A configurar ambiente..."
if [ ! -f ".env" ]; then
  cp .env.example .env
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  echo "  Ficheiro .env criado com JWT_SECRET aleatório."
fi

# ---- Base de dados ----
echo "[8/8] A configurar base de dados..."
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts 2>/dev/null || echo "  Seed já aplicado ou base de dados já populada."

# ---- Build da aplicação ----
echo ""
echo "A compilar aplicação..."
npm run build

# ---- PM2 ----
echo ""
echo "A configurar PM2..."
pm2 delete smartevent 2>/dev/null || true
pm2 start npm --name "smartevent" -- start
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# ---- Nginx ----
echo ""
echo "A configurar Nginx..."
cat > /etc/nginx/sites-available/smartevent << NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 50M;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/smartevent /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ---- SSL com Certbot ----
echo ""
read -p "Configurar HTTPS com Let's Encrypt? (s/N): " SSL
if [ "$SSL" = "s" ] || [ "$SSL" = "S" ]; then
  certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
fi

# ---- Firewall ----
echo ""
echo "A configurar firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "========================================"
echo " INSTALAÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "  Aplicação: http://${DOMAIN}"
echo "  Admin:      admin@rentpro.pt"
echo "  Senha:      admin123"
echo ""
echo "  Comandos úteis:"
echo "    pm2 status          - Ver estado"
echo "    pm2 logs smartevent - Ver logs"
echo "    pm2 restart smartevent - Reiniciar"
echo "    cd $APP_DIR && git pull && npm install && npm run build && pm2 restart smartevent - Atualizar"
echo ""
