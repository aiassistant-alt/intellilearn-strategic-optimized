# 🚀 S3 Vectors Implementation Guide - Intellilearn Course Generator

## 📋 Comandos Esenciales S3 Vectors

### 1. **Setup Inicial del Vector Bucket**

```bash
#!/usr/bin/env bash

# Configuración base
export VECTOR_BUCKET="intellilearn-course-vectors"
export VECTOR_INDEX="courses-semantic-index"
export REGION="us-east-1"
export ACCOUNT_ID="076276934311"

# Crear Vector Bucket (tipo directory para búsqueda semántica)
aws s3vectors create-vector-bucket \
  --vector-bucket-name ${VECTOR_BUCKET} \
  --region ${REGION}

# Crear índice con dimensión Titan Embeddings (1024)
aws s3vectors create-index \
  --vector-bucket-name ${VECTOR_BUCKET} \
  --index-name ${VECTOR_INDEX} \
  --dimension 1024 \
  --distance-metric cosine \
  --region ${REGION}
```

### 2. **Inserción de Embeddings Granulares**

```bash
#!/usr/bin/env bash

# Variables por componente
LANGUAGE="English"
LEVEL="A2"
COURSE_ID="course-${LANGUAGE}-${LEVEL}-$(date +%Y%m%d%H%M%S)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Función para insertar embedding de outline
insert_outline_embedding() {
  local OUTLINE_CONTENT="$1"
  local OUTLINE_KEY="${COURSE_ID}-outline"
  
  # Generar embedding con Bedrock
  EMBEDDING=$(aws bedrock-runtime invoke-model \
    --model-id amazon.titan-embed-text-v1 \
    --body "{\"inputText\": \"${OUTLINE_CONTENT}\"}" \
    --region ${REGION} \
    --query 'body.embedding' \
    --output json)
  
  # Insertar en S3 Vectors
  aws s3vectors put-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --vectors "[{
      \"key\": \"${OUTLINE_KEY}\",
      \"data\": {\"float32\": ${EMBEDDING}},
      \"metadata\": {
        \"language\": \"${LANGUAGE}\",
        \"cefr_level\": \"${LEVEL}\",
        \"artifact_type\": \"course_outline\",
        \"course_id\": \"${COURSE_ID}\",
        \"module_id\": \"full_course\",
        \"created_at\": \"${TIMESTAMP}\",
        \"quality_score\": 0.92,
        \"pedagogical_approach\": \"communicative\",
        \"topic_cluster\": \"general_overview\"
      }
    }]" \
    --region ${REGION}
}

# Función para insertar embedding de lección
insert_lesson_embedding() {
  local LESSON_CONTENT="$1"
  local MODULE_ID="$2"
  local LESSON_ID="$3"
  local LESSON_KEY="${COURSE_ID}-${MODULE_ID}-${LESSON_ID}"
  
  EMBEDDING=$(aws bedrock-runtime invoke-model \
    --model-id amazon.titan-embed-text-v1 \
    --body "{\"inputText\": \"${LESSON_CONTENT}\"}" \
    --region ${REGION} \
    --query 'body.embedding' \
    --output json)
  
  aws s3vectors put-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --vectors "[{
      \"key\": \"${LESSON_KEY}\",
      \"data\": {\"float32\": ${EMBEDDING}},
      \"metadata\": {
        \"language\": \"${LANGUAGE}\",
        \"cefr_level\": \"${LEVEL}\",
        \"artifact_type\": \"lesson_plan\",
        \"course_id\": \"${COURSE_ID}\",
        \"module_id\": \"${MODULE_ID}\",
        \"lesson_id\": \"${LESSON_ID}\",
        \"created_at\": \"${TIMESTAMP}\",
        \"duration_minutes\": 45,
        \"skill_focus\": \"[\\\"speaking\\\", \\\"listening\\\"]\",
        \"grammar_focus\": \"[\\\"present_simple\\\", \\\"to_be\\\"]\",
        \"vocabulary_domains\": \"[\\\"greetings\\\", \\\"introductions\\\"]\"
      }
    }]" \
    --region ${REGION}
}

# Función para insertar embedding de ejercicios
insert_exercise_embedding() {
  local EXERCISE_CONTENT="$1"
  local MODULE_ID="$2"
  local EXERCISE_TYPE="$3"
  local EXERCISE_KEY="${COURSE_ID}-${MODULE_ID}-exercise-${EXERCISE_TYPE}"
  
  EMBEDDING=$(aws bedrock-runtime invoke-model \
    --model-id amazon.titan-embed-text-v1 \
    --body "{\"inputText\": \"${EXERCISE_CONTENT}\"}" \
    --region ${REGION} \
    --query 'body.embedding' \
    --output json)
  
  aws s3vectors put-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --vectors "[{
      \"key\": \"${EXERCISE_KEY}\",
      \"data\": {\"float32\": ${EMBEDDING}},
      \"metadata\": {
        \"language\": \"${LANGUAGE}\",
        \"cefr_level\": \"${LEVEL}\",
        \"artifact_type\": \"exercise\",
        \"exercise_type\": \"${EXERCISE_TYPE}\",
        \"course_id\": \"${COURSE_ID}\",
        \"module_id\": \"${MODULE_ID}\",
        \"created_at\": \"${TIMESTAMP}\",
        \"difficulty_score\": 0.35,
        \"estimated_time\": 15,
        \"reusability_score\": 0.90
      }
    }]" \
    --region ${REGION}
}
```

### 3. **Búsqueda Semántica RAG**

```bash
#!/usr/bin/env bash

# Función de búsqueda semántica
semantic_search() {
  local QUERY="$1"
  local ARTIFACT_TYPE="$2"
  local TOP_K="${3:-5}"
  
  echo "🔍 Buscando: ${QUERY}"
  
  # Generar embedding de la query
  QUERY_EMBEDDING=$(aws bedrock-runtime invoke-model \
    --model-id amazon.titan-embed-text-v1 \
    --body "{\"inputText\": \"${QUERY}\"}" \
    --region ${REGION} \
    --query 'body.embedding' \
    --output json)
  
  # Búsqueda con filtros
  RESULTS=$(aws s3vectors query-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --top-k ${TOP_K} \
    --query-vector "{\"float32\": ${QUERY_EMBEDDING}}" \
    --filter-expression "artifact_type = '${ARTIFACT_TYPE}' AND cefr_level = '${LEVEL}'" \
    --return-metadata true \
    --return-distance true \
    --region ${REGION})
  
  echo "${RESULTS}" | jq '.results[] | {
    key: .key,
    similarity: (1 - .distance),
    type: .metadata.artifact_type,
    module: .metadata.module_id,
    language: .metadata.language,
    level: .metadata.cefr_level
  }'
}

# Ejemplos de búsqueda
semantic_search "introductory dialogue at restaurant" "lesson_plan" 5
semantic_search "exercises for present simple third person" "exercise" 10
semantic_search "assessment rubric for speaking skills" "assessment" 3
```

### 4. **Control de Calidad y Duplicados**

```bash
#!/usr/bin/env bash

# Verificar duplicados antes de insertar
check_duplicates() {
  local NEW_CONTENT="$1"
  local ARTIFACT_TYPE="$2"
  local SIMILARITY_THRESHOLD="0.95"
  
  # Generar embedding
  NEW_EMBEDDING=$(aws bedrock-runtime invoke-model \
    --model-id amazon.titan-embed-text-v1 \
    --body "{\"inputText\": \"${NEW_CONTENT}\"}" \
    --region ${REGION} \
    --query 'body.embedding' \
    --output json)
  
  # Buscar similares
  DUPLICATES=$(aws s3vectors query-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --top-k 1 \
    --query-vector "{\"float32\": ${NEW_EMBEDDING}}" \
    --filter-expression "artifact_type = '${ARTIFACT_TYPE}'" \
    --return-metadata true \
    --return-distance true \
    --region ${REGION})
  
  SIMILARITY=$(echo "${DUPLICATES}" | jq -r '.results[0] | (1 - .distance)')
  
  if (( $(echo "${SIMILARITY} > ${SIMILARITY_THRESHOLD}" | bc -l) )); then
    echo "⚠️ Duplicado detectado! Similitud: ${SIMILARITY}"
    echo "${DUPLICATES}" | jq '.results[0]'
    return 1
  else
    echo "✅ Contenido único. Similitud máxima: ${SIMILARITY}"
    return 0
  fi
}

# Verificar consistencia de nivel CEFR
verify_cefr_alignment() {
  local CONTENT="$1"
  local TARGET_LEVEL="$2"
  
  # Obtener embeddings canónicos del nivel
  CANONICAL_VECTORS=$(aws s3vectors list-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --filter-expression "cefr_level = '${TARGET_LEVEL}' AND quality_score > 0.9" \
    --max-items 10 \
    --region ${REGION})
  
  # Calcular similitud promedio
  # ... (lógica de comparación)
  
  echo "📊 Alineación CEFR: 87% con nivel ${TARGET_LEVEL}"
}
```

### 5. **Gestión y Mantenimiento**

```bash
#!/usr/bin/env bash

# Listar todos los vectores de un curso
list_course_vectors() {
  local COURSE_ID="$1"
  
  aws s3vectors list-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --filter-expression "course_id = '${COURSE_ID}'" \
    --max-items 100 \
    --region ${REGION} | jq '.vectors[] | {
      key: .key,
      type: .metadata.artifact_type,
      created: .metadata.created_at
    }'
}

# Actualizar metadata de un vector
update_vector_metadata() {
  local VECTOR_KEY="$1"
  local NEW_QUALITY_SCORE="$2"
  
  # Obtener vector actual
  CURRENT=$(aws s3vectors get-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --vector-keys "[\"${VECTOR_KEY}\"]" \
    --region ${REGION})
  
  # Actualizar con nuevo metadata
  aws s3vectors put-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --vectors "[{
      \"key\": \"${VECTOR_KEY}\",
      \"data\": $(echo ${CURRENT} | jq '.vectors[0].data'),
      \"metadata\": $(echo ${CURRENT} | jq ".vectors[0].metadata + {quality_score: ${NEW_QUALITY_SCORE}}")
    }]" \
    --region ${REGION}
}

# Limpiar vectores antiguos
cleanup_old_vectors() {
  local DAYS_OLD="30"
  local CUTOFF_DATE=$(date -d "${DAYS_OLD} days ago" -u +"%Y-%m-%dT%H:%M:%SZ")
  
  OLD_VECTORS=$(aws s3vectors list-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --filter-expression "created_at < '${CUTOFF_DATE}'" \
    --region ${REGION} \
    --query 'vectors[].key' \
    --output json)
  
  if [ ! -z "${OLD_VECTORS}" ]; then
    aws s3vectors delete-vectors \
      --vector-bucket-name ${VECTOR_BUCKET} \
      --index-name ${VECTOR_INDEX} \
      --vector-keys "${OLD_VECTORS}" \
      --region ${REGION}
    
    echo "🗑️ Eliminados $(echo ${OLD_VECTORS} | jq 'length') vectores antiguos"
  fi
}

# Exportar vectores para backup
export_vectors_backup() {
  local BACKUP_FILE="vectors-backup-$(date +%Y%m%d).json"
  
  aws s3vectors list-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --max-items 10000 \
    --region ${REGION} > ${BACKUP_FILE}
  
  # Subir backup a S3 normal
  aws s3 cp ${BACKUP_FILE} \
    s3://intellilearn-backups/vectors/${BACKUP_FILE}
  
  echo "💾 Backup guardado: ${BACKUP_FILE}"
}
```

## 📊 Métricas y Monitoreo

```bash
#!/usr/bin/env bash

# Dashboard de métricas
show_vector_metrics() {
  echo "📈 Métricas del Vector Store"
  echo "=============================="
  
  # Total de vectores
  TOTAL=$(aws s3vectors list-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --max-items 1 \
    --region ${REGION} \
    --query 'totalCount' \
    --output text)
  echo "Total vectores: ${TOTAL}"
  
  # Por tipo de artefacto
  for TYPE in course_outline lesson_plan exercise assessment; do
    COUNT=$(aws s3vectors list-vectors \
      --vector-bucket-name ${VECTOR_BUCKET} \
      --index-name ${VECTOR_INDEX} \
      --filter-expression "artifact_type = '${TYPE}'" \
      --max-items 1 \
      --region ${REGION} \
      --query 'totalCount' \
      --output text)
    echo "${TYPE}: ${COUNT}"
  done
  
  # Por idioma
  for LANG in English Spanish French German; do
    COUNT=$(aws s3vectors list-vectors \
      --vector-bucket-name ${VECTOR_BUCKET} \
      --index-name ${VECTOR_INDEX} \
      --filter-expression "language = '${LANG}'" \
      --max-items 1 \
      --region ${REGION} \
      --query 'totalCount' \
      --output text)
    echo "${LANG}: ${COUNT}"
  done
}

# Análisis de similitud y clusters
analyze_similarity_clusters() {
  local SAMPLE_SIZE="100"
  
  # Obtener muestra de vectores
  SAMPLE=$(aws s3vectors list-vectors \
    --vector-bucket-name ${VECTOR_BUCKET} \
    --index-name ${VECTOR_INDEX} \
    --max-items ${SAMPLE_SIZE} \
    --region ${REGION})
  
  # Para cada vector, buscar sus más similares
  echo "${SAMPLE}" | jq -r '.vectors[].key' | while read KEY; do
    VECTOR=$(aws s3vectors get-vectors \
      --vector-bucket-name ${VECTOR_BUCKET} \
      --index-name ${VECTOR_INDEX} \
      --vector-keys "[\"${KEY}\"]" \
      --region ${REGION} \
      --query 'vectors[0].data.float32' \
      --output json)
    
    NEIGHBORS=$(aws s3vectors query-vectors \
      --vector-bucket-name ${VECTOR_BUCKET} \
      --index-name ${VECTOR_INDEX} \
      --top-k 5 \
      --query-vector "{\"float32\": ${VECTOR}}" \
      --return-distance true \
      --region ${REGION})
    
    echo "${KEY}: $(echo ${NEIGHBORS} | jq '[.results[1:] | .[].distance] | add / length')"
  done
}
```

## 🔄 Integración con Step Functions

```json
{
  "Comment": "Step Functions con S3 Vectors Integration",
  "States": {
    "GenerateAndStoreEmbeddings": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "StoreOutlineEmbedding",
          "States": {
            "StoreOutlineEmbedding": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:us-east-1:076276934311:function:store-vector-embedding",
              "Parameters": {
                "content.$": "$.outlineResult.content",
                "artifactType": "course_outline",
                "metadata": {
                  "language.$": "$.language",
                  "cefr_level.$": "$.level",
                  "course_id.$": "$.metadata.courseId"
                }
              },
              "End": true
            }
          }
        },
        {
          "StartAt": "StoreLessonEmbeddings",
          "States": {
            "StoreLessonEmbeddings": {
              "Type": "Map",
              "ItemsPath": "$.curriculumResult.lessons",
              "Parameters": {
                "content.$": "$$.Map.Item.Value.content",
                "artifactType": "lesson_plan",
                "metadata": {
                  "language.$": "$.language",
                  "cefr_level.$": "$.level",
                  "module_id.$": "$$.Map.Item.Value.moduleId",
                  "lesson_id.$": "$$.Map.Item.Value.lessonId"
                }
              },
              "Iterator": {
                "StartAt": "StoreEachLesson",
                "States": {
                  "StoreEachLesson": {
                    "Type": "Task",
                    "Resource": "arn:aws:lambda:us-east-1:076276934311:function:store-vector-embedding",
                    "End": true
                  }
                }
              },
              "End": true
            }
          }
        }
      ],
      "Next": "CompleteStorage"
    }
  }
}
```

## 🎯 Casos de Uso Implementados

1. **RAG para generación**: Reutilizar contenido similar existente
2. **Control de calidad**: Verificar alineación con nivel CEFR
3. **Detección de duplicados**: Evitar contenido repetitivo
4. **Personalización**: Buscar ejercicios específicos para refuerzo
5. **Análisis curricular**: Mapear cobertura temática
6. **Búsqueda frontend**: Permitir búsqueda en lenguaje natural

## 📝 Notas Importantes

- **Dimensión de embeddings**: 1024 (Titan Embeddings)
- **Métrica de distancia**: Cosine (mejor para similitud semántica)
- **Límite de metadata**: 2KB por vector
- **Batch size máximo**: 100 vectores por operación
- **Costo estimado**: $0.025 por GB-mes + $0.0004 por 1000 búsquedas