#!/usr/bin/env python3
"""
Setup S3 Vectors for Intellilearn
Author: Luis Arturo Parra - Telmo AI
Created: 2025-09-14
Usage: Create vector index and test basic functionality
"""

import boto3
import json
from botocore.exceptions import ClientError

def setup_s3_vectors():
    """Setup S3 Vectors bucket and index for Intellilearn"""
    
    # Configuration
    BUCKET_NAME = "intellilearn-vectors"
    INDEX_NAME = "courses-semantic-index"
    REGION = "us-east-1"
    VECTOR_DIMENSION = 1536  # For amazon.titan-embed-text-v1
    SIMILARITY_METRIC = "cosine"
    
    print("🚀 Setting up S3 Vectors for Intellilearn...")
    print(f"📦 Bucket: {BUCKET_NAME}")
    print(f"📊 Index: {INDEX_NAME}")
    print(f"🌍 Region: {REGION}")
    print(f"📏 Dimensions: {VECTOR_DIMENSION}")
    print(f"📐 Metric: {SIMILARITY_METRIC}")
    print("-" * 50)
    
    try:
        # Create S3 Vectors client
        s3vectors = boto3.client('s3vectors', region_name=REGION)
        
        # Check if bucket exists
        print("🔍 Checking vector bucket...")
        try:
            response = s3vectors.get_vector_bucket(vectorBucketName=BUCKET_NAME)
            print(f"✅ Vector bucket '{BUCKET_NAME}' exists")
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchVectorBucket':
                print(f"❌ Vector bucket '{BUCKET_NAME}' not found")
                print("💡 Please create the vector bucket in AWS Console first")
                return False
            else:
                raise e
        
        # Check if index exists
        print("🔍 Checking vector index...")
        try:
            response = s3vectors.describe_index(
                vectorBucketName=BUCKET_NAME,
                indexName=INDEX_NAME
            )
            print(f"✅ Vector index '{INDEX_NAME}' already exists")
            print(f"   Dimensions: {response['vectorDimension']}")
            print(f"   Metric: {response['similarityMetric']}")
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchIndex':
                print(f"📊 Creating vector index '{INDEX_NAME}'...")
                try:
                    response = s3vectors.create_index(
                        vectorBucketName=BUCKET_NAME,
                        indexName=INDEX_NAME,
                        vectorDimension=VECTOR_DIMENSION,
                        similarityMetric=SIMILARITY_METRIC
                    )
                    print(f"✅ Vector index '{INDEX_NAME}' created successfully!")
                except ClientError as create_error:
                    print(f"❌ Failed to create index: {create_error}")
                    return False
            else:
                raise e
        
        # List all indexes in the bucket
        print("📋 Listing all indexes in bucket...")
        try:
            response = s3vectors.list_indexes(vectorBucketName=BUCKET_NAME)
            indexes = response.get('indexes', [])
            print(f"📊 Found {len(indexes)} index(es):")
            for idx in indexes:
                print(f"   - {idx['indexName']} ({idx['vectorDimension']}D, {idx['similarityMetric']})")
        except ClientError as e:
            print(f"⚠️ Could not list indexes: {e}")
        
        print("-" * 50)
        print("✅ S3 Vectors setup completed successfully!")
        print(f"🎯 Ready to use: s3vectors-embed put --vector-bucket-name {BUCKET_NAME} --index-name {INDEX_NAME}")
        return True
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'UnrecognizedClientException':
            print("❌ S3 Vectors service not available in this region or account")
            print("💡 Make sure S3 Vectors is enabled and you have proper permissions")
        elif error_code == 'AccessDenied':
            print("❌ Access denied - missing S3 Vectors permissions")
            print("💡 Add s3vectors:* permissions to your IAM role/user")
        else:
            print(f"❌ Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_embedding():
    """Test embedding functionality"""
    print("\n🧪 Testing embedding functionality...")
    
    BUCKET_NAME = "intellilearn-vectors"
    INDEX_NAME = "courses-semantic-index"
    
    # Test data
    test_content = "This is a sample English A2 lesson about greetings and introductions"
    test_metadata = {
        "artifact_type": "lesson_plan",
        "language": "English", 
        "cefr_level": "A2",
        "skill_focus": "speaking,vocabulary",
        "platform": "Intellilearn",
        "created_at": "2025-09-14T00:00:00Z",
        "quality_score": "0.95"
    }
    
    print(f"📝 Content: {test_content}")
    print(f"🏷️ Metadata: {json.dumps(test_metadata, indent=2)}")
    
    try:
        # Use s3vectors-embed CLI via subprocess
        import subprocess
        
        cmd = [
            "s3vectors-embed", "put",
            "--vector-bucket-name", BUCKET_NAME,
            "--index-name", INDEX_NAME,
            "--model-id", "amazon.titan-embed-text-v1",
            "--text-value", test_content,
            "--key", "test-lesson-greeting-001",
            "--metadata", json.dumps(test_metadata),
            "--region", "us-east-1"
        ]
        
        print("🚀 Running embedding command...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Embedding created successfully!")
            print(f"📤 Output: {result.stdout}")
        else:
            print("❌ Embedding failed:")
            print(f"📤 Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🎓 Intellilearn S3 Vectors Setup")
    print("=" * 50)
    
    # Setup S3 Vectors
    if setup_s3_vectors():
        # Test embedding
        test_embedding()
    else:
        print("❌ Setup failed - skipping tests")
    
    print("\n🏁 Setup complete!")
