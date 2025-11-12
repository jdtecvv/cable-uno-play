#!/bin/bash
#==============================================================================
# Cable Uno Play - Instalación Compatible con XUI.one
# Para servidores que YA tienen: Nginx, MySQL, XUI.one
#==============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Banner
clear
echo -e "${RED}"
cat << "EOF"
   ____      _     _         _   _             ____  _             
  / ___|__ _| |__ | | ___   | | | |_ __   ___ |  _ \| | __ _ _   _ 
 | |   / _` | '_ \| |/ _ \  | | | | '_ \ / _ \| |_) | |/ _` | | | |
 | |__| (_| | |_) | |  __/  | |_| | | | | (_) |  __/| | (_| | |_| |
  \____\__,_|_.__/|_|\___|   \___/|_| |_|\___/|_|   |_|\__,_|\__, |
                                                               |___/ 
EOF
echo -e "${NC}"
echo -e "${BLUE}Instalación Compatible con XUI.one${NC}\n"

# Verificar root
if [[ $EUID -ne 0 ]]; then
   print_error "Este script debe ejecutarse con sudo"
   echo "Uso: sudo bash install-server-xui-compatible.sh"
   exit 1
fi

REAL_USER="${SUDO_USER:-$USER}"
REAL_HOME=$(eval echo ~$REAL_USER)

print_header "📋 CONFIGURACIÓN"

print_info "Este script instalará Cable Uno Play SIN afectar:"
echo "  - XUI.one (puertos 80, 443, 8080, 8081)"
echo "  - MySQL (puerto 3306)"
echo "  - Nginx existente"
echo ""

read -p "🗄️  Contraseña para PostgreSQL: " -s DB_PASSWORD
echo ""
read -p "📂 ¿Tienes el proyecto en un repositorio Git? (s/n): " HAS_GIT

if [[ "$HAS_GIT" == "s" || "$HAS_GIT" == "S" ]]; then
    read -p "🔗 URL del repositorio Git: " GIT_REPO
    USE_GIT=true
else
    USE_GIT=false
    print_warning "Deberás subir el proyecto manualmente a /var/www/cable-uno-play"
fi

echo ""
print_info "Cable Uno Play usará:"
echo "  - Puerto: 5000 (interno)"
echo "  - Acceso: http://tu-ip/cableuno"
echo "  - Base de datos: PostgreSQL (puerto 5432)"
echo ""

read -p "¿Continuar? (s/n): " CONFIRM
if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
    print_warning "Instalación cancelada"
    exit 0
fi

#==============================================================================
# PASO 1: Actualizar Sistema
#==============================================================================

print_header "🔄 ACTUALIZANDO SISTEMA"

apt update
apt install -y curl wget git build-essential

print_success "Sistema actualizado"

#==============================================================================
# PASO 2: Verificar/Instalar Node.js 20
#==============================================================================

print_header "📦 NODE.JS 20"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_warning "Node.js ya instalado: $NODE_VERSION"
    
    # Verificar si es versión 20
    MAJOR_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -lt 20 ]; then
        print_warning "Actualizando a Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    fi
else
    print_info "Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

NODE_VERSION=$(node --version)
print_success "Node.js $NODE_VERSION listo"

#==============================================================================
# PASO 3: Instalar PostgreSQL (No afecta MySQL)
#==============================================================================

print_header "🗄️  POSTGRESQL"

if command -v psql &> /dev/null; then
    print_warning "PostgreSQL ya instalado"
else
    print_info "Instalando PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi

print_success "PostgreSQL corriendo (puerto 5432)"

#==============================================================================
# PASO 4: Configurar Base de Datos
#==============================================================================

print_header "⚙️  CONFIGURANDO BASE DE DATOS"

DB_NAME="cableuno_play"
DB_USER="cableuno"

# Crear base de datos
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"

print_success "Base de datos 'cableuno_play' creada"

#==============================================================================
# PASO 5: Instalar PM2
#==============================================================================

print_header "🔧 PM2"

if command -v pm2 &> /dev/null; then
    print_warning "PM2 ya instalado"
else
    npm install -g pm2
    print_success "PM2 instalado"
fi

#==============================================================================
# PASO 6: Preparar Proyecto
#==============================================================================

print_header "📂 PREPARANDO PROYECTO"

PROJECT_DIR="/var/www/cable-uno-play"

mkdir -p $PROJECT_DIR
chown -R $REAL_USER:$REAL_USER $PROJECT_DIR

if [[ "$USE_GIT" == true ]]; then
    print_info "Clonando repositorio..."
    
    if [ -d "$PROJECT_DIR/.git" ]; then
        print_warning "Proyecto ya existe, actualizando..."
        cd $PROJECT_DIR
        sudo -u $REAL_USER git pull origin main || sudo -u $REAL_USER git pull origin master
    else
        sudo -u $REAL_USER git clone $GIT_REPO $PROJECT_DIR
    fi
    
    print_success "Proyecto clonado"
else
    print_warning "NO se clonó repositorio"
    print_info "Sube el proyecto manualmente a: $PROJECT_DIR"
    print_info "Comando desde tu Mac: scp -r cable-uno-play/ usuario@servidor:/var/www/cable-uno-play/"
    
    read -p "¿Ya subiste el proyecto? (s/n): " PROJECT_READY
    if [[ "$PROJECT_READY" != "s" && "$PROJECT_READY" != "S" ]]; then
        print_error "Sube el proyecto y ejecuta el script nuevamente"
        exit 1
    fi
fi

cd $PROJECT_DIR

#==============================================================================
# PASO 7: Configurar Variables de Entorno
#==============================================================================

print_header "⚙️  VARIABLES DE ENTORNO"

cat > .env << EOL
# Base de datos PostgreSQL
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PGHOST=localhost
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME

# Node
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
EOL

chown $REAL_USER:$REAL_USER .env
chmod 600 .env

print_success "Variables de entorno configuradas"

#==============================================================================
# PASO 8: Instalar y Compilar
#==============================================================================

print_header "🏗️  COMPILANDO PROYECTO"

print_info "Instalando dependencias..."
sudo -u $REAL_USER npm install

print_info "Compilando..."
sudo -u $REAL_USER npm run build

print_info "Sincronizando base de datos..."
sudo -u $REAL_USER npm run db:push || true

print_success "Proyecto compilado"

#==============================================================================
# PASO 9: Configurar PM2
#==============================================================================

print_header "🚀 INICIANDO APLICACIÓN"

pm2 delete cable-uno-play 2>/dev/null || true

cd $PROJECT_DIR
sudo -u $REAL_USER pm2 start dist/index.js --name cable-uno-play

sudo -u $REAL_USER pm2 save
sudo -u $REAL_USER pm2 startup systemd -u $REAL_USER --hp $REAL_HOME

print_success "Cable Uno Play corriendo en puerto 5000"

#==============================================================================
# PASO 10: Configurar Nginx (Compatible con XUI.one)
#==============================================================================

print_header "🌐 CONFIGURANDO NGINX"

NGINX_CONFIG="/etc/nginx/sites-available/cable-uno-play"

cat > $NGINX_CONFIG << 'EOL'
# Cable Uno Play - Compatible con XUI.one
location /cableuno {
    rewrite ^/cableuno(/.*)$ $1 break;
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}

location /cableuno/assets {
    alias /var/www/cable-uno-play/dist/public/assets;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
EOL

print_info "Configuración de Nginx creada"
print_warning "IMPORTANTE: Debes agregar esto a tu configuración Nginx existente"

echo ""
print_info "Pasos manuales necesarios:"
echo "1. Edita tu configuración Nginx principal (probablemente /etc/nginx/sites-available/default)"
echo "2. Dentro del bloque 'server { ... }', agrega:"
echo ""
cat $NGINX_CONFIG
echo ""
echo "3. Luego ejecuta:"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""

read -p "¿Quieres que intente agregarlo automáticamente? (s/n): " AUTO_NGINX

if [[ "$AUTO_NGINX" == "s" || "$AUTO_NGINX" == "S" ]]; then
    # Intentar agregar a configuración default
    DEFAULT_CONF="/etc/nginx/sites-available/default"
    
    if [ -f "$DEFAULT_CONF" ]; then
        # Hacer backup
        cp $DEFAULT_CONF ${DEFAULT_CONF}.backup
        
        # Buscar el último server block y agregar antes de }
        sed -i '/^[[:space:]]*server[[:space:]]*{/,/^}/!b; /^}/i\    # Cable Uno Play\n    include /etc/nginx/sites-available/cable-uno-play;' $DEFAULT_CONF
        
        # Probar configuración
        if nginx -t 2>/dev/null; then
            systemctl reload nginx
            print_success "Nginx configurado automáticamente"
        else
            print_error "Error en configuración Nginx, restaurando backup..."
            mv ${DEFAULT_CONF}.backup $DEFAULT_CONF
            print_warning "Configura Nginx manualmente"
        fi
    else
        print_warning "No se encontró configuración default, configura manualmente"
    fi
fi

#==============================================================================
# PASO 11: Script de Actualización
#==============================================================================

print_header "🔄 SCRIPT DE ACTUALIZACIÓN"

UPDATE_SCRIPT="$PROJECT_DIR/update.sh"

if [[ "$USE_GIT" == true ]]; then
cat > $UPDATE_SCRIPT << 'EOL'
#!/bin/bash
set -e

echo "🔄 Actualizando Cable Uno Play..."

cd /var/www/cable-uno-play

echo "📥 Descargando cambios..."
git pull origin main || git pull origin master

echo "📦 Instalando dependencias..."
npm install

echo "🏗️  Compilando..."
npm run build

echo "🗄️  Actualizando base de datos..."
npm run db:push

echo "🔄 Reiniciando aplicación..."
pm2 restart cable-uno-play

echo "✅ ¡Actualización completada!"
pm2 status
EOL
else
cat > $UPDATE_SCRIPT << 'EOL'
#!/bin/bash
set -e

echo "🔄 Actualizando Cable Uno Play..."

cd /var/www/cable-uno-play

echo "📦 Instalando dependencias..."
npm install

echo "🏗️  Compilando..."
npm run build

echo "🗄️  Actualizando base de datos..."
npm run db:push

echo "🔄 Reiniciando aplicación..."
pm2 restart cable-uno-play

echo "✅ ¡Actualización completada!"
pm2 status
EOL
fi

chmod +x $UPDATE_SCRIPT
chown $REAL_USER:$REAL_USER $UPDATE_SCRIPT

print_success "Script de actualización: $UPDATE_SCRIPT"

#==============================================================================
# FINALIZACIÓN
#==============================================================================

print_header "🎉 ¡INSTALACIÓN COMPLETADA!"

echo ""
print_success "Cable Uno Play está instalado y corriendo"
echo ""

print_info "Acceso a la aplicación:"
echo "  🌐 http://TU_IP:5000 (directo)"
echo "  🌐 http://TU_IP/cableuno (si configuraste Nginx)"
echo ""

print_info "Servicios:"
echo "  - Cable Uno Play: Puerto 5000 (PM2)"
echo "  - PostgreSQL: Puerto 5432"
echo "  - XUI.one: Sin cambios (puertos 80, 443, 8080, 8081)"
echo "  - MySQL: Sin cambios (puerto 3306)"
echo ""

print_info "Comandos útiles:"
echo "  pm2 status                     # Ver estado"
echo "  pm2 logs cable-uno-play        # Ver logs"
echo "  pm2 restart cable-uno-play     # Reiniciar"
echo "  $UPDATE_SCRIPT                 # Actualizar app"
echo ""

print_success "✅ Todo listo!"

pm2 status
