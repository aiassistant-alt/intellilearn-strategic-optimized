#!/bin/bash

echo "🔍 Verificando configuración del dominio telmoai.mx"
echo "================================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. Verificando registros DNS...${NC}"
echo "   Ejecutando: dig A telmoai.mx +short"
dig A telmoai.mx +short
echo ""

echo -e "${BLUE}2. Verificando www subdomain...${NC}"
echo "   Ejecutando: dig A www.telmoai.mx +short"
dig A www.telmoai.mx +short
echo ""

echo -e "${BLUE}3. Verificando nameservers...${NC}"
echo "   Ejecutando: dig NS telmoai.mx +short"
dig NS telmoai.mx +short
echo ""

echo -e "${YELLOW}📋 Pasos manuales necesarios:${NC}"
echo ""
echo "1. ${GREEN}Crear certificado SSL en ACM:${NC}"
echo "   - Ve a: https://console.aws.amazon.com/acm/home?region=us-east-1"
echo "   - Click en 'Request certificate'"
echo "   - Selecciona 'Request a public certificate'"
echo "   - Dominio: telmoai.mx"
echo "   - Agregar nombres alternativos: www.telmoai.mx, *.telmoai.mx"
echo "   - Validación: DNS validation"
echo "   - Click en 'Request'"
echo ""
echo "2. ${GREEN}Validar el certificado:${NC}"
echo "   - En ACM, click en el certificado pendiente"
echo "   - Click en 'Create records in Route 53'"
echo "   - Esperar 5-10 minutos hasta que el estado sea 'Issued'"
echo ""
echo "3. ${GREEN}Actualizar CloudFront:${NC}"
echo "   - Ve a: https://console.aws.amazon.com/cloudfront/"
echo "   - Selecciona la distribución E11HT8YLQY6FDL"
echo "   - En 'General' → 'Settings' → 'Edit'"
echo "   - En 'Alternate domain name (CNAME)' agregar:"
echo "     • telmoai.mx"
echo "     • www.telmoai.mx"
echo "   - En 'Custom SSL certificate' selecciona el certificado creado"
echo "   - Click en 'Save changes'"
echo ""
echo -e "${BLUE}URLs de acceso una vez configurado:${NC}"
echo "   https://telmoai.mx"
echo "   https://www.telmoai.mx"
echo ""
echo -e "${YELLOW}⏱️  Tiempo estimado de propagación DNS: 30 min - 4 horas${NC}"