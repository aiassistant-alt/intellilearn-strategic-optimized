#!/bin/bash

echo "🔒 AUDITORÍA DE SEGURIDAD - INTELLILEARN"
echo "========================================"
echo "Fecha: $(date)"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load credentials
source .env.aws

echo -e "${YELLOW}1. VERIFICANDO CREDENCIALES EXPUESTAS${NC}"
echo "----------------------------------------"

# Buscar API keys en archivos
echo "Buscando AWS Access Keys..."
grep -r "AKIA[A-Z0-9]\{16\}" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" 2>/dev/null | grep -v ".env" | head -20

echo ""
echo "Buscando secretos potenciales..."
grep -r -i "password\|secret\|key\|token" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" --exclude="*.md" 2>/dev/null | grep -v ".env" | grep -E "(=|:)\s*['\"][^'\"]{10,}" | head -20

echo ""
echo -e "${YELLOW}2. VERIFICANDO BUCKETS S3${NC}"
echo "-------------------------"

# Listar todos los buckets
aws s3api list-buckets --query 'Buckets[*].Name' --output table

# Verificar ACLs públicas
echo ""
echo "Verificando buckets públicos..."
for bucket in $(aws s3api list-buckets --query 'Buckets[*].Name' --output text); do
    echo -n "Checking $bucket... "
    
    # Check bucket ACL
    acl=$(aws s3api get-bucket-acl --bucket $bucket 2>/dev/null | jq -r '.Grants[] | select(.Grantee.Type=="Group" and .Grantee.URI | contains("AllUsers")) | .Permission' | head -1)
    
    # Check bucket policy
    policy=$(aws s3api get-bucket-policy --bucket $bucket 2>/dev/null | jq -r '.Policy' | grep -i "Principal.*\*" | head -1)
    
    # Check public access block
    public_block=$(aws s3api get-public-access-block --bucket $bucket 2>/dev/null | jq -r 'if .PublicAccessBlockConfiguration.BlockPublicAcls==true then "BLOCKED" else "ALLOWED" end')
    
    if [ ! -z "$acl" ] || [ ! -z "$policy" ]; then
        echo -e "${RED}⚠️  PÚBLICO DETECTADO${NC}"
    elif [ "$public_block" == "ALLOWED" ]; then
        echo -e "${YELLOW}⚠️  Acceso público permitido${NC}"
    else
        echo -e "${GREEN}✅ Seguro${NC}"
    fi
done

echo ""
echo -e "${YELLOW}3. VERIFICANDO CLOUDFRONT${NC}"
echo "-------------------------"

# Verificar distribuciones CloudFront
aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Enabled]' --output table

echo ""
echo -e "${YELLOW}4. VERIFICANDO COGNITO${NC}" 
echo "----------------------"

# Verificar User Pools
echo "User Pools:"
aws cognito-idp list-user-pools --max-results 10 --query 'UserPools[*].[Id,Name]' --output table

echo ""
echo -e "${YELLOW}5. VERIFICANDO IAM${NC}"
echo "------------------"

# Verificar usuarios IAM
echo "Usuarios IAM activos:"
aws iam list-users --query 'Users[*].[UserName,CreateDate]' --output table

# Verificar access keys antiguas
echo ""
echo "Access Keys activas:"
for user in $(aws iam list-users --query 'Users[*].UserName' --output text); do
    keys=$(aws iam list-access-keys --user-name $user --query 'AccessKeyMetadata[?Status==`Active`].[AccessKeyId,CreateDate]' --output text 2>/dev/null)
    if [ ! -z "$keys" ]; then
        echo "Usuario: $user"
        echo "$keys"
        
        # Calcular edad de la key
        while IFS=$'\t' read -r key_id create_date; do
            age_days=$(( ($(date +%s) - $(date -d "$create_date" +%s)) / 86400 ))
            if [ $age_days -gt 90 ]; then
                echo -e "  ${RED}⚠️  Key $key_id tiene $age_days días (ROTAR)${NC}"
            fi
        done <<< "$keys"
        echo ""
    fi
done

echo ""
echo -e "${YELLOW}6. VERIFICANDO DYNAMODB${NC}"
echo "-----------------------"

# Listar tablas
aws dynamodb list-tables --query 'TableNames' --output table

echo ""
echo -e "${YELLOW}7. ANÁLISIS DE VULNERABILIDADES${NC}"
echo "--------------------------------"

# Verificar archivos sensibles
echo "Archivos potencialmente sensibles:"
find . -type f \( -name "*.pem" -o -name "*.key" -o -name "*.pfx" -o -name "*.p12" -o -name "id_rsa*" -o -name "*.cer" -o -name "*.crt" \) 2>/dev/null | grep -v node_modules | head -10

echo ""
echo "Archivos de configuración expuestos:"
find . -type f \( -name "*.env*" -o -name "*config*.json" -o -name "*.yaml" -o -name "*.yml" \) 2>/dev/null | grep -v node_modules | grep -v ".env.example" | head -20

echo ""
echo -e "${YELLOW}8. RECOMENDACIONES DE SEGURIDAD${NC}"
echo "--------------------------------"
echo -e "${RED}CRÍTICAS:${NC}"
echo "1. ⚠️  ROTAR INMEDIATAMENTE las credenciales AWS expuestas"
echo "2. ⚠️  Habilitar MFA en la cuenta root de AWS"
echo "3. ⚠️  Configurar AWS CloudTrail para auditoría"
echo "4. ⚠️  Implementar rotación automática de credenciales"

echo ""
echo -e "${YELLOW}IMPORTANTES:${NC}"
echo "5. Revisar y restringir políticas IAM (principio de menor privilegio)"
echo "6. Habilitar versioning en todos los buckets S3"
echo "7. Configurar AWS Config para monitoreo de compliance"
echo "8. Implementar AWS Security Hub"
echo "9. Configurar alertas en CloudWatch"
echo "10. Realizar pentesting periódico"

echo ""
echo "Auditoría completada: $(date)"