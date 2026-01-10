#!/bin/bash
set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}   MIGRACIÓN A BASE DE DATOS LOCAL (POSTGRES)${NC}"
echo -e "${GREEN}=============================================${NC}"

# 1. Verificar si es root/sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Este script debe ejecutarse con sudo${NC}"
   echo "Uso: sudo ./actualizar-a-local.sh"
   exit 1
fi

# 2. Instalar PostgreSQL si no existe
echo -e "\n${YELLOW}1. Verificando PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo "Instalando PostgreSQL..."
    apt update
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
else
    echo "PostgreSQL ya está instalado."
fi

# 3. Configurar Base de Datos y Usuario
echo -e "\n${YELLOW}2. Configurando Base de Datos...${NC}"
DB_NAME="cableuno_play"
DB_USER="cableuno"

# Pedir contraseña si no está configurada en .env o usar una por defecto
# Intentamos leer la contraseña del .env actual si existe
CURRENT_PWD=$(grep "PGPASSWORD" .env | cut -d '=' -f2)
if [ -z "$CURRENT_PWD" ]; then
    read -p "Ingrese una contraseña segura para la base de datos local: " DB_PASSWORD
else
    DB_PASSWORD=$CURRENT_PWD
    echo "Usando contraseña existente del archivo .env"
fi

# Crear usuario y DB si no existen (ignorando errores si ya existen)
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
# Asegurar que el usuario tenga permiso de creación de esquemas
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true

# 4. Actualizar .env
echo -e "\n${YELLOW}3. Actualizando archivo .env...${NC}"
# Backup del .env anterior
cp .env .env.backup.$(date +%F_%T)

# Construir nueva URL local
LOCAL_DB_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# Reemplazar o agregar DATABASE_URL
if grep -q "DATABASE_URL=" .env; then
    # Comentar la línea anterior y agregar la nueva
    sed -i "s|^DATABASE_URL=.*|# DATABASE_URL_OLD (Neon/Replit)\nDATABASE_URL=$LOCAL_DB_URL|" .env
else
    echo "DATABASE_URL=$LOCAL_DB_URL" >> .env
fi

# Asegurar otras variables de PG
if ! grep -q "PGUSER=" .env; then
    echo "PGUSER=$DB_USER" >> .env
    echo "PGPASSWORD=$DB_PASSWORD" >> .env
    echo "PGDATABASE=$DB_NAME" >> .env
    echo "PGHOST=localhost" >> .env
    echo "PGPORT=5432" >> .env
fi

# 5. Instalar dependencias y Construir
echo -e "\n${YELLOW}4. Actualizando aplicación...${NC}"
# Obtener el usuario real para ejecutar comandos de npm (no root)
REAL_USER="${SUDO_USER:-$USER}"

echo "Instalando dependencias..."
sudo -u $REAL_USER npm install

echo "Construyendo aplicación..."
sudo -u $REAL_USER npm run build

# 6. Migrar esquema de base de datos
echo -e "\n${YELLOW}5. Sincronizando base de datos...${NC}"
sudo -u $REAL_USER npm run db:push

# 7. Reiniciar PM2
echo -e "\n${YELLOW}6. Reiniciando servicio...${NC}"
pm2 restart cable-uno-play || pm2 start dist/index.js --name cable-uno-play

echo -e "\n${GREEN}=============================================${NC}"
echo -e "${GREEN}   ¡MIGRACIÓN COMPLETADA CON ÉXITO!   ${NC}"
echo -e "${GREEN}=============================================${NC}"
echo "La aplicación ahora corre localmente usando PostgreSQL."
echo "URL de Base de Datos configurada: $LOCAL_DB_URL"
echo ""
pm2 status
