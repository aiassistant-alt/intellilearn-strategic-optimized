#!/bin/bash

# 🎓 Script de Prueba para Course Generator Step Functions
# Author: Telmo AI
# Updated: 2025-09-13

echo "🚀 Iniciando prueba de Course Generator Step Functions..."
echo "================================"

# Configuración
REGION="us-east-1"
LANGUAGE="${1:-English}"
LEVEL="${2:-A2}"
COURSE_TYPE="${3:-intensive}"
DURATION="${4:-4 weeks}"

echo "📚 Parámetros del curso:"
echo "  - Idioma: $LANGUAGE"
echo "  - Nivel CEFR: $LEVEL"
echo "  - Tipo: $COURSE_TYPE"
echo "  - Duración: $DURATION"
echo ""

# Verificar credenciales AWS
echo "🔐 Verificando credenciales AWS..."
aws sts get-caller-identity --region $REGION > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Error: No se encontraron credenciales AWS válidas"
    echo "   Por favor configure AWS CLI con: aws configure"
    exit 1
fi

# Buscar State Machine
echo "🔍 Buscando State Machine..."
STATE_MACHINE_ARN=$(aws stepfunctions list-state-machines \
  --region $REGION \
  --query "stateMachines[?contains(name, 'VisualCourseGeneration') || contains(name, 'CourseGeneration')].stateMachineArn" \
  --output text | head -1)

if [ -z "$STATE_MACHINE_ARN" ]; then
    echo "❌ Error: No se encontró el State Machine"
    echo "   Asegúrese de haber desplegado la infraestructura con:"
    echo "   cdk deploy IntellilearnCourseGenerator-dev --region us-east-1"
    exit 1
fi

echo "✅ State Machine encontrado:"
echo "   $STATE_MACHINE_ARN"
echo ""

# Preparar input JSON con el campo duration requerido
INPUT_JSON=$(cat <<EOF
{
  "language": "$LANGUAGE",
  "level": "$LEVEL",
  "courseType": "$COURSE_TYPE",
  "duration": "$DURATION"
}
EOF
)

echo "📝 Input JSON:"
echo "$INPUT_JSON" | jq '.'
echo ""

# Ejecutar State Machine
echo "▶️  Ejecutando State Machine..."
EXECUTION_OUTPUT=$(aws stepfunctions start-execution \
  --state-machine-arn "$STATE_MACHINE_ARN" \
  --region $REGION \
  --name "test-$(date +%Y%m%d-%H%M%S)" \
  --input "$INPUT_JSON" 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Error al ejecutar State Machine:"
    echo "$EXECUTION_OUTPUT"
    exit 1
fi

# Extraer ARN de ejecución
EXECUTION_ARN=$(echo "$EXECUTION_OUTPUT" | jq -r '.executionArn')

echo "✅ Ejecución iniciada exitosamente!"
echo "   ARN: $EXECUTION_ARN"
echo ""
echo "📊 Monitorear progreso:"
echo "   - Consola AWS: https://console.aws.amazon.com/states/home?region=$REGION#/executions/details/$EXECUTION_ARN"
echo ""

# Monitorear estado
echo "⏳ Esperando resultado (máximo 60 segundos)..."
COUNTER=0
MAX_WAIT=60

while [ $COUNTER -lt $MAX_WAIT ]; do
    sleep 5
    COUNTER=$((COUNTER + 5))
    
    STATUS=$(aws stepfunctions describe-execution \
      --execution-arn "$EXECUTION_ARN" \
      --region $REGION \
      --query 'status' \
      --output text 2>/dev/null)
    
    echo -n "   Estado actual: $STATUS ($COUNTER s)"
    
    if [ "$STATUS" == "SUCCEEDED" ]; then
        echo ""
        echo ""
        echo "🎉 ¡Curso generado exitosamente!"
        
        # Obtener output
        OUTPUT=$(aws stepfunctions describe-execution \
          --execution-arn "$EXECUTION_ARN" \
          --region $REGION \
          --query 'output' \
          --output text 2>/dev/null)
        
        if [ ! -z "$OUTPUT" ]; then
            echo ""
            echo "📄 Resumen del resultado:"
            echo "$OUTPUT" | jq '.' | head -20
        fi
        
        echo ""
        echo "✅ Verificar archivos generados:"
        echo "   aws s3 ls s3://intellilearn-courses-076276934311/courses/$LANGUAGE/$LEVEL/ --recursive"
        echo ""
        echo "📥 Descargar curso:"
        echo "   aws s3 cp s3://intellilearn-courses-076276934311/courses/$LANGUAGE/$LEVEL/course-$LANGUAGE-$LEVEL.json ./curso-generado.json"
        
        exit 0
    elif [ "$STATUS" == "FAILED" ] || [ "$STATUS" == "TIMED_OUT" ] || [ "$STATUS" == "ABORTED" ]; then
        echo ""
        echo ""
        echo "❌ La ejecución falló con estado: $STATUS"
        
        # Obtener error
        ERROR=$(aws stepfunctions get-execution-history \
          --execution-arn "$EXECUTION_ARN" \
          --region $REGION \
          --reverse-order \
          --max-items 5 \
          --query 'events[?type==`ExecutionFailed`].executionFailedEventDetails' \
          --output json 2>/dev/null)
        
        if [ ! -z "$ERROR" ] && [ "$ERROR" != "[]" ]; then
            echo ""
            echo "📛 Detalles del error:"
            echo "$ERROR" | jq '.'
        fi
        
        echo ""
        echo "💡 Posibles soluciones:"
        echo "   1. Verificar que los modelos Bedrock estén habilitados:"
        echo "      https://console.aws.amazon.com/bedrock/home?region=$REGION#/modelaccess"
        echo "   2. Revisar los logs en CloudWatch:"
        echo "      aws logs tail /aws/stepfunctions/intellilearn-course-generation --follow --region $REGION"
        echo "   3. Verificar permisos IAM del rol de Step Functions"
        
        exit 1
    else
        echo -ne "\r"
    fi
done

echo ""
echo ""
echo "⏱️  Tiempo de espera agotado. La ejecución continúa en segundo plano."
echo "   Verificar estado en: https://console.aws.amazon.com/states/home?region=$REGION#/executions/details/$EXECUTION_ARN"
exit 0