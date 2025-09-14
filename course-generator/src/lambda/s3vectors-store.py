"""
S3 Vectors Store Lambda for Intellilearn
Author: Luis Arturo Parra - Telmo AI
Created: 2025-09-14
Usage: Lambda function to store vectors in S3 Vectors from Step Functions
"""

import json
import subprocess
import tempfile
import os
from typing import Dict, List, Any

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Lambda handler for S3 Vectors store operations
    """
    
    try:
        # Extract parameters
        action = event.get('action', 'store_vector')
        vector_bucket = event.get('vectorBucket', 'intellilearn-vectors')
        index_name = event.get('indexName', 'courses-semantic-index')
        key = event.get('key', '')
        embedding = event.get('embedding', [])
        metadata = event.get('metadata', {})
        
        print(f"📊 S3 Vectors Store Request:")
        print(f"   Action: {action}")
        print(f"   Bucket: {vector_bucket}")
        print(f"   Index: {index_name}")
        print(f"   Key: {key}")
        print(f"   Embedding dimensions: {len(embedding)}")
        print(f"   Metadata keys: {list(metadata.keys())}")
        
        if action == 'store_vector':
            return store_vector(
                vector_bucket, index_name, key, embedding, metadata
            )
        else:
            return {
                'statusCode': 400,
                'error': f'Unknown action: {action}',
                'success': False
            }
            
    except Exception as e:
        print(f"❌ Error in S3 Vectors store: {str(e)}")
        return {
            'statusCode': 500,
            'error': str(e),
            'success': False
        }

def store_vector(
    vector_bucket: str,
    index_name: str, 
    key: str,
    embedding: List[float],
    metadata: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Store vector using s3vectors-embed CLI
    """
    
    try:
        # Create temporary file with embedding content
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp_file:
            # Use the content from metadata if available, otherwise use key
            content = metadata.get('S3VECTORS-EMBED-SRC-CONTENT', f"Vector content for {key}")
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Build s3vectors-embed command
            cmd = [
                's3vectors-embed', 'put',
                '--vector-bucket-name', vector_bucket,
                '--index-name', index_name,
                '--model-id', 'amazon.titan-embed-text-v1',
                '--text', temp_file_path,
                '--key', key,
                '--metadata', json.dumps(metadata),
                '--region', 'us-east-1'
            ]
            
            print(f"🚀 Executing store command: {' '.join(cmd[:8])}...")
            
            # Execute s3vectors-embed command
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Vector stored successfully: {key}")
                
                # Parse response if JSON
                try:
                    response_data = json.loads(result.stdout)
                except json.JSONDecodeError:
                    response_data = {"message": result.stdout}
                
                return {
                    'statusCode': 200,
                    'success': True,
                    'key': key,
                    'vectorBucket': vector_bucket,
                    'indexName': index_name,
                    'metadata': metadata,
                    'response': response_data
                }
            else:
                error_msg = result.stderr or result.stdout
                print(f"❌ s3vectors-embed store failed: {error_msg}")
                
                return {
                    'statusCode': 400,
                    'error': f's3vectors-embed failed: {error_msg}',
                    'success': False
                }
                
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except subprocess.TimeoutExpired:
        print("❌ s3vectors-embed store command timed out")
        return {
            'statusCode': 408,
            'error': 'Store operation timed out',
            'success': False
        }
        
    except Exception as e:
        print(f"❌ Unexpected error in store: {str(e)}")
        return {
            'statusCode': 500,
            'error': f'Unexpected error: {str(e)}',
            'success': False
        }

# Test function for local development
if __name__ == "__main__":
    # Test event
    test_event = {
        "action": "store_vector",
        "vectorBucket": "intellilearn-vectors",
        "indexName": "courses-semantic-index",
        "key": "test-outline-001",
        "embedding": [0.1] * 1536,  # Dummy embedding
        "metadata": {
            "artifact_type": "course_outline",
            "language": "English",
            "cefr_level": "A2",
            "platform": "Intellilearn",
            "S3VECTORS-EMBED-SRC-CONTENT": "Test course outline content"
        }
    }
    
    result = lambda_handler(test_event, None)
    print("🧪 Test Result:")
    print(json.dumps(result, indent=2))
