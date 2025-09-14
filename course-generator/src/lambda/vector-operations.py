"""
Vector Operations Lambda for S3 Vectors
Author: Luis Arturo Parra - Telmo AI
Created: 2025-09-13
Purpose: Handle vector storage and search operations for course content
"""

import json
import boto3
import os
from typing import Dict, List, Any, Optional
from datetime import datetime
import hashlib

# Initialize AWS clients
s3_vectors_client = boto3.client('s3vectors', region_name='us-east-1')
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')
s3_client = boto3.client('s3')

# Configuration
VECTOR_BUCKET = os.environ.get('VECTOR_BUCKET', 'intellilearn-course-vectors')
VECTOR_INDEX = os.environ.get('VECTOR_INDEX', 'courses-semantic-index')
DIMENSION = 1024  # Titan Embeddings dimension

def lambda_handler(event: Dict, context: Any) -> Dict:
    """
    Main Lambda handler for vector operations
    """
    action = event.get('action')
    
    try:
        if action == 'put_vector':
            return put_vector(event)
        elif action == 'semantic_search':
            return semantic_search(event)
        elif action == 'check_duplicate':
            return check_duplicate(event)
        elif action == 'get_vector':
            return get_vector(event)
        elif action == 'delete_vector':
            return delete_vector(event)
        else:
            raise ValueError(f"Unknown action: {action}")
    
    except Exception as e:
        print(f"Error in vector operation: {str(e)}")
        return {
            'statusCode': 500,
            'error': str(e)
        }

def put_vector(event: Dict) -> Dict:
    """
    Store a vector in S3 Vectors with metadata
    """
    try:
        vector_key = event['key']
        embedding = event['embedding']
        metadata = event.get('metadata', {})
        
        # Add timestamp if not present
        if 'created_at' not in metadata:
            metadata['created_at'] = datetime.utcnow().isoformat() + 'Z'
        
        # Add content hash for deduplication
        content_hash = hashlib.sha256(
            json.dumps(embedding[:100]).encode()
        ).hexdigest()[:16]
        metadata['content_hash'] = content_hash
        
        # Store vector
        response = s3_vectors_client.put_vectors(
            VectorBucketName=VECTOR_BUCKET,
            IndexName=VECTOR_INDEX,
            Vectors=[
                {
                    'Key': vector_key,
                    'Data': {
                        'Float32': embedding
                    },
                    'Metadata': metadata
                }
            ]
        )
        
        print(f"✅ Vector stored: {vector_key}")
        
        return {
            'statusCode': 200,
            'vectorKey': vector_key,
            'metadata': metadata,
            'contentHash': content_hash
        }
    
    except Exception as e:
        print(f"Error storing vector: {str(e)}")
        raise

def semantic_search(event: Dict) -> Dict:
    """
    Perform semantic search using query or embedding
    """
    try:
        query = event.get('query')
        embedding = event.get('embedding')
        filters = event.get('filters', {})
        top_k = event.get('topK', 5)
        similarity_threshold = event.get('similarityThreshold', 0.7)
        
        # Generate embedding if query provided
        if query and not embedding:
            embedding = generate_embedding(query)
        
        # Build filter expression
        filter_expression = build_filter_expression(filters)
        
        # Search vectors
        search_params = {
            'VectorBucketName': VECTOR_BUCKET,
            'IndexName': VECTOR_INDEX,
            'TopK': top_k,
            'QueryVector': {
                'Float32': embedding
            },
            'ReturnMetadata': True,
            'ReturnDistance': True
        }
        
        if filter_expression:
            search_params['FilterExpression'] = filter_expression
        
        response = s3_vectors_client.query_vectors(**search_params)
        
        # Process results
        results = []
        items_reused = 0
        
        for item in response.get('Results', []):
            similarity = 1 - item['Distance']
            
            if similarity >= similarity_threshold:
                results.append({
                    'key': item['Key'],
                    'similarity': similarity,
                    'metadata': item.get('Metadata', {}),
                    'canReuse': similarity >= 0.85
                })
                
                if similarity >= 0.85:
                    items_reused += 1
        
        print(f"🔍 Found {len(results)} results, {items_reused} reusable")
        
        return {
            'statusCode': 200,
            'results': results,
            'totalFound': len(results),
            'itemsReused': items_reused,
            'query': query
        }
    
    except Exception as e:
        print(f"Error in semantic search: {str(e)}")
        raise

def check_duplicate(event: Dict) -> Dict:
    """
    Check if content is duplicate based on similarity
    """
    try:
        content = event['content']
        artifact_type = event.get('artifactType')
        similarity_threshold = event.get('similarityThreshold', 0.95)
        
        # Generate embedding
        embedding = generate_embedding(content)
        
        # Search for similar content
        search_params = {
            'VectorBucketName': VECTOR_BUCKET,
            'IndexName': VECTOR_INDEX,
            'TopK': 1,
            'QueryVector': {
                'Float32': embedding
            },
            'ReturnMetadata': True,
            'ReturnDistance': True
        }
        
        if artifact_type:
            search_params['FilterExpression'] = f"artifact_type = '{artifact_type}'"
        
        response = s3_vectors_client.query_vectors(**search_params)
        
        # Check similarity
        is_duplicate = False
        duplicate_info = None
        
        if response.get('Results'):
            top_result = response['Results'][0]
            similarity = 1 - top_result['Distance']
            
            if similarity >= similarity_threshold:
                is_duplicate = True
                duplicate_info = {
                    'key': top_result['Key'],
                    'similarity': similarity,
                    'metadata': top_result.get('Metadata', {})
                }
                print(f"⚠️ Duplicate detected: {similarity:.2%} similar to {top_result['Key']}")
            else:
                print(f"✅ Content is unique. Max similarity: {similarity:.2%}")
        
        return {
            'statusCode': 200,
            'isDuplicate': is_duplicate,
            'duplicateInfo': duplicate_info,
            'maxSimilarity': similarity if response.get('Results') else 0
        }
    
    except Exception as e:
        print(f"Error checking duplicate: {str(e)}")
        raise

def get_vector(event: Dict) -> Dict:
    """
    Retrieve specific vector(s) by key
    """
    try:
        vector_keys = event.get('vectorKeys', [])
        
        if isinstance(vector_keys, str):
            vector_keys = [vector_keys]
        
        response = s3_vectors_client.get_vectors(
            VectorBucketName=VECTOR_BUCKET,
            IndexName=VECTOR_INDEX,
            VectorKeys=vector_keys
        )
        
        vectors = []
        for vector in response.get('Vectors', []):
            vectors.append({
                'key': vector['Key'],
                'metadata': vector.get('Metadata', {}),
                'embedding': vector['Data']['Float32'][:10] + ['...']  # Truncate for response
            })
        
        return {
            'statusCode': 200,
            'vectors': vectors,
            'count': len(vectors)
        }
    
    except Exception as e:
        print(f"Error getting vectors: {str(e)}")
        raise

def delete_vector(event: Dict) -> Dict:
    """
    Delete vector(s) by key
    """
    try:
        vector_keys = event.get('vectorKeys', [])
        
        if isinstance(vector_keys, str):
            vector_keys = [vector_keys]
        
        response = s3_vectors_client.delete_vectors(
            VectorBucketName=VECTOR_BUCKET,
            IndexName=VECTOR_INDEX,
            VectorKeys=vector_keys
        )
        
        print(f"🗑️ Deleted {len(vector_keys)} vectors")
        
        return {
            'statusCode': 200,
            'deleted': vector_keys,
            'count': len(vector_keys)
        }
    
    except Exception as e:
        print(f"Error deleting vectors: {str(e)}")
        raise

def generate_embedding(text: str) -> List[float]:
    """
    Generate embedding using Amazon Titan
    """
    try:
        response = bedrock_runtime.invoke_model(
            modelId='amazon.titan-embed-text-v1',
            body=json.dumps({
                'inputText': text
            })
        )
        
        result = json.loads(response['body'].read())
        return result['embedding']
    
    except Exception as e:
        print(f"Error generating embedding: {str(e)}")
        raise

def build_filter_expression(filters: Dict) -> Optional[str]:
    """
    Build filter expression for vector search
    """
    if not filters:
        return None
    
    expressions = []
    
    for key, value in filters.items():
        if isinstance(value, str):
            expressions.append(f"{key} = '{value}'")
        elif isinstance(value, (int, float)):
            expressions.append(f"{key} = {value}")
        elif isinstance(value, dict):
            # Handle complex filters like {gte: 0.85}
            if 'gte' in value:
                expressions.append(f"{key} >= {value['gte']}")
            elif 'lte' in value:
                expressions.append(f"{key} <= {value['lte']}")
            elif 'contains' in value:
                expressions.append(f"contains({key}, '{value['contains']}')")
    
    return ' AND '.join(expressions) if expressions else None