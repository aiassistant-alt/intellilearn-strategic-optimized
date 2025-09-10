#!/bin/bash

echo "🧹 Limpiando credenciales hardcodeadas..."
echo "========================================"

# Buscar y limpiar archivos con credenciales hardcodeadas
FILES_TO_CLEAN=(
    "scripts/aws-resource-audit.ps1"
    "scripts/create-productive-pmp-course.js" 
    "scripts/delete-old-course.js"
    "scripts/query-dynamo.js"
    "scripts/manual-aws-setup.sh"
    "DEPLOYMENT_STATUS.md"
)

for file in "${FILES_TO_CLEAN[@]}"; do
    if [ -f "$file" ]; then
        echo "Limpiando: $file"
        # Eliminar líneas con credenciales AWS
        sed -i '/AKIA[A-Z0-9]\{16\}/d' "$file"
        sed -i '/accessKeyId.*:.*["'"'"'][A-Z0-9]\{20\}/d' "$file"
        sed -i '/secretAccessKey.*:.*["'"'"'].*/d' "$file"
        sed -i '/AWS_ACCESS_KEY_ID.*=.*AKIA/d' "$file"
        sed -i '/AWS_SECRET_ACCESS_KEY.*=.*[a-zA-Z0-9\/+]\{40\}/d' "$file"
    fi
done

# Eliminar archivos que no deberían existir
echo ""
echo "Eliminando archivos sensibles..."
rm -f scripts/manual-aws-setup.sh
rm -f scripts/aws-resource-audit.ps1

echo "✅ Limpieza completada"