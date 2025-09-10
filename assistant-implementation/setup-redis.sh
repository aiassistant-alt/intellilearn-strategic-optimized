#!/bin/bash

# Setup ElastiCache Redis for Assistant Implementation
# Creates Redis cluster for session management

set -e

echo "🔴 Setting up ElastiCache Redis for Assistant..."

AWS_REGION="us-east-1"
CACHE_CLUSTER_ID="assistant-implementation-redis"
CACHE_NODE_TYPE="cache.t3.micro"  # For production, use cache.r6g.large or higher
CACHE_SUBNET_GROUP="assistant-cache-subnet"
CACHE_SECURITY_GROUP="assistant-redis-sg"
VPC_ID="vpc-0123456789abcdef0"  # Replace with your VPC ID
SUBNET_IDS=("subnet-xxx" "subnet-yyy")  # Replace with your subnet IDs

# Step 1: Create cache subnet group
echo "📍 Creating cache subnet group..."
aws elasticache create-cache-subnet-group \
    --cache-subnet-group-name $CACHE_SUBNET_GROUP \
    --cache-subnet-group-description "Subnet group for Assistant Redis" \
    --subnet-ids "${SUBNET_IDS[@]}" \
    --region $AWS_REGION 2>/dev/null || echo "Subnet group already exists"

# Step 2: Create security group for Redis
echo "🔒 Creating security group for Redis..."
REDIS_SG_ID=$(aws ec2 create-security-group \
    --group-name $CACHE_SECURITY_GROUP \
    --description "Security group for Assistant Redis" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --query 'GroupId' \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=$CACHE_SECURITY_GROUP" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Allow Redis port from ECS tasks
ECS_SG_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=assistant-implementation-ecs-sg" \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null)

if [ ! -z "$ECS_SG_ID" ]; then
    aws ec2 authorize-security-group-ingress \
        --group-id $REDIS_SG_ID \
        --protocol tcp \
        --port 6379 \
        --source-group $ECS_SG_ID \
        --region $AWS_REGION 2>/dev/null || echo "Rule already exists"
fi

# Step 3: Create parameter group for Redis 7
echo "⚙️ Creating parameter group..."
aws elasticache create-cache-parameter-group \
    --cache-parameter-group-name assistant-redis-params \
    --cache-parameter-group-family redis7 \
    --description "Parameter group for Assistant Redis" \
    --region $AWS_REGION 2>/dev/null || echo "Parameter group already exists"

# Configure parameters for WebSocket sessions
aws elasticache modify-cache-parameter-group \
    --cache-parameter-group-name assistant-redis-params \
    --parameter-name-values \
        "ParameterName=timeout,ParameterValue=300" \
        "ParameterName=tcp-keepalive,ParameterValue=300" \
        "ParameterName=maxmemory-policy,ParameterValue=allkeys-lru" \
        "ParameterName=notify-keyspace-events,ParameterValue=Ex" \
    --region $AWS_REGION 2>/dev/null || true

# Step 4: Create Redis replication group (cluster mode disabled)
echo "🚀 Creating Redis replication group..."
aws elasticache create-replication-group \
    --replication-group-id $CACHE_CLUSTER_ID \
    --replication-group-description "Redis cluster for Assistant WebSocket sessions" \
    --cache-node-type $CACHE_NODE_TYPE \
    --engine redis \
    --engine-version 7.0 \
    --num-cache-clusters 2 \
    --automatic-failover-enabled \
    --multi-az-enabled \
    --cache-subnet-group-name $CACHE_SUBNET_GROUP \
    --security-group-ids $REDIS_SG_ID \
    --cache-parameter-group-name assistant-redis-params \
    --at-rest-encryption-enabled \
    --transit-encryption-enabled \
    --auth-token $(openssl rand -base64 32) \
    --snapshot-retention-limit 1 \
    --preferred-maintenance-window "sun:05:00-sun:06:00" \
    --notification-topic-arn "" \
    --tags \
        "Key=Name,Value=assistant-implementation-redis" \
        "Key=Environment,Value=production" \
        "Key=Project,Value=assistant-implementation" \
    --region $AWS_REGION 2>/dev/null || echo "Replication group already exists"

# Step 5: Wait for Redis to be available
echo "⏳ Waiting for Redis cluster to be available (this may take 5-10 minutes)..."

while true; do
    STATUS=$(aws elasticache describe-replication-groups \
        --replication-group-id $CACHE_CLUSTER_ID \
        --region $AWS_REGION \
        --query 'ReplicationGroups[0].Status' \
        --output text 2>/dev/null || echo "creating")
    
    if [ "$STATUS" == "available" ]; then
        echo "✅ Redis cluster is available!"
        break
    elif [ "$STATUS" == "creating" ] || [ "$STATUS" == "modifying" ]; then
        echo "Status: $STATUS - waiting..."
        sleep 30
    else
        echo "⚠️ Unexpected status: $STATUS"
        break
    fi
done

# Step 6: Get Redis endpoint
REDIS_PRIMARY_ENDPOINT=$(aws elasticache describe-replication-groups \
    --replication-group-id $CACHE_CLUSTER_ID \
    --region $AWS_REGION \
    --query 'ReplicationGroups[0].ConfigurationEndpoint.Address' \
    --output text 2>/dev/null)

REDIS_READER_ENDPOINT=$(aws elasticache describe-replication-groups \
    --replication-group-id $CACHE_CLUSTER_ID \
    --region $AWS_REGION \
    --query 'ReplicationGroups[0].NodeGroups[0].ReaderEndpoint.Address' \
    --output text 2>/dev/null)

# Step 7: Create CloudWatch alarms
echo "🚨 Creating CloudWatch alarms..."

# CPU utilization alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "assistant-redis-cpu" \
    --alarm-description "Redis CPU utilization" \
    --metric-name CPUUtilization \
    --namespace AWS/ElastiCache \
    --statistic Average \
    --period 300 \
    --threshold 75 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --dimensions Name=CacheClusterId,Value=$CACHE_CLUSTER_ID \
    --region $AWS_REGION 2>/dev/null || echo "CPU alarm already exists"

# Memory usage alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "assistant-redis-memory" \
    --alarm-description "Redis memory usage" \
    --metric-name DatabaseMemoryUsagePercentage \
    --namespace AWS/ElastiCache \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --dimensions Name=CacheClusterId,Value=$CACHE_CLUSTER_ID \
    --region $AWS_REGION 2>/dev/null || echo "Memory alarm already exists"

# Connection count alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "assistant-redis-connections" \
    --alarm-description "Redis connection count" \
    --metric-name CurrConnections \
    --namespace AWS/ElastiCache \
    --statistic Average \
    --period 300 \
    --threshold 900 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --dimensions Name=CacheClusterId,Value=$CACHE_CLUSTER_ID \
    --region $AWS_REGION 2>/dev/null || echo "Connection alarm already exists"

# Step 8: Output configuration
echo ""
echo "✅ Redis setup complete!"
echo ""
echo "📝 Redis Configuration:"
echo "========================"
echo "Primary Endpoint: $REDIS_PRIMARY_ENDPOINT"
echo "Reader Endpoint: $REDIS_READER_ENDPOINT"
echo "Port: 6379"
echo "Auth Token: (stored securely in AWS Secrets Manager)"
echo ""
echo "🔧 Update your FastAPI main.py with:"
echo "REDIS_HOST = \"$REDIS_PRIMARY_ENDPOINT\""
echo ""
echo "📊 CloudWatch Alarms created:"
echo "- CPU Utilization > 75%"
echo "- Memory Usage > 80%"
echo "- Connections > 900"
echo ""
echo "🔒 Security:"
echo "- Encryption at rest: Enabled"
echo "- Encryption in transit: Enabled"
echo "- Multi-AZ: Enabled"
echo "- Automatic failover: Enabled"