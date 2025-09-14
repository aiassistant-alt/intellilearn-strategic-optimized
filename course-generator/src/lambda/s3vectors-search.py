"""
S3 Vectors Search Lambda for Intellilearn
Author: Luis Arturo Parra - Telmo AI
Created: 2025-09-14
Usage: Lambda function to search S3 Vectors from Step Functions
"""

import json
import boto3
import subprocess
import os
from typing import Dict, List, Any

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Lambda handler for S3 Vectors search operations
    
    Args:
        event: Contains search parameters
        context: Lambda context
        
    Returns:
        Search results in JSON format
    """
    
    try:
        # Extract parameters
        action = event.get('action', 'search_similar')
        vector_bucket = event.get('vectorBucket', 'intellilearn-vectors')
        index_name = event.get('indexName', 'courses-semantic-index')
        query_text = event.get('queryText', '')
        top_k = event.get('topK', 5)
        filters = event.get('filters', {})
        return_distance = event.get('returnDistance', True)
        return_metadata = event.get('returnMetadata', True)
        
        print(f"🔍 S3 Vectors Search Request:")
        print(f"   Action: {action}")
        print(f"   Bucket: {vector_bucket}")
        print(f"   Index: {index_name}")
        print(f"   Query: {query_text}")
        print(f"   Top-K: {top_k}")
        print(f"   Filters: {json.dumps(filters)}")
        
        if action == 'search_similar':
            return search_similar_content(
                vector_bucket, index_name, query_text, top_k, 
                filters, return_distance, return_metadata
            )
        elif action == 'check_duplicates':
            return check_duplicates(
                vector_bucket, index_name, event.get('queryEmbedding', []),
                top_k, filters, event.get('duplicateThreshold', 0.95)
            )
        elif action == 'validate_level':
            return validate_cefr_level(
                vector_bucket, index_name, event.get('queryEmbedding', []),
                event.get('targetLevel', 'A2'), top_k, filters
            )
        else:
            return {
                'statusCode': 400,
                'error': f'Unknown action: {action}',
                'results': [],
                'summary': {'error': 'Invalid action'}
            }
            
    except Exception as e:
        print(f"❌ Error in S3 Vectors search: {str(e)}")
        return {
            'statusCode': 500,
            'error': str(e),
            'results': [],
            'summary': {'error': 'Lambda execution failed'}
        }

def search_similar_content(
    vector_bucket: str, 
    index_name: str, 
    query_text: str, 
    top_k: int,
    filters: Dict[str, Any],
    return_distance: bool,
    return_metadata: bool
) -> Dict[str, Any]:
    """
    Search for similar content using s3vectors-embed CLI
    """
    
    try:
        # Build s3vectors-embed command
        cmd = [
            's3vectors-embed', 'query',
            '--vector-bucket-name', vector_bucket,
            '--index-name', index_name,
            '--model-id', 'amazon.titan-embed-text-v1',
            '--query-input', query_text,
            '--k', str(top_k),
            '--region', 'us-east-1'
        ]
        
        # Add distance return if requested
        if return_distance:
            cmd.append('--return-distance')
            
        # Add metadata return if requested
        if return_metadata:
            cmd.extend(['--return-metadata'])
        else:
            cmd.extend(['--no-return-metadata'])
            
        # Build filter expression if provided
        if filters:
            filter_conditions = []
            for key, value in filters.items():
                if isinstance(value, str):
                    filter_conditions.append(f'"{key}": {{"$eq": "{value}"}}')
                else:
                    filter_conditions.append(f'"{key}": {{"$eq": {json.dumps(value)}}}')
            
            if filter_conditions:
                if len(filter_conditions) == 1:
                    filter_expr = f'{{{filter_conditions[0]}}}'
                else:
                    conditions_str = ', '.join([f'{{{cond}}}' for cond in filter_conditions])
                    filter_expr = f'{{"$and": [{conditions_str}]}}'
                
                cmd.extend(['--filter', filter_expr])
                print(f"🔍 Filter expression: {filter_expr}")
        
        print(f"🚀 Executing command: {' '.join(cmd)}")
        
        # Execute s3vectors-embed command
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            # Parse JSON response
            response_data = json.loads(result.stdout)
            
            print(f"✅ Search successful:")
            print(f"   Results found: {len(response_data.get('results', []))}")
            print(f"   Query dimensions: {response_data.get('summary', {}).get('queryDimensions', 'unknown')}")
            
            return {
                'statusCode': 200,
                'results': response_data.get('results', []),
                'summary': response_data.get('summary', {}),
                'searchParameters': {
                    'vectorBucket': vector_bucket,
                    'indexName': index_name,
                    'queryText': query_text,
                    'topK': top_k,
                    'filters': filters
                }
            }
        else:
            error_msg = result.stderr or result.stdout
            print(f"❌ s3vectors-embed command failed: {error_msg}")
            
            return {
                'statusCode': 400,
                'error': f's3vectors-embed failed: {error_msg}',
                'results': [],
                'summary': {'error': 'Command execution failed'}
            }
            
    except subprocess.TimeoutExpired:
        print("❌ s3vectors-embed command timed out")
        return {
            'statusCode': 408,
            'error': 'Search operation timed out',
            'results': [],
            'summary': {'error': 'Timeout'}
        }
        
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse s3vectors-embed response: {str(e)}")
        return {
            'statusCode': 500,
            'error': f'JSON parsing failed: {str(e)}',
            'results': [],
            'summary': {'error': 'Response parsing failed'}
        }
        
    except Exception as e:
        print(f"❌ Unexpected error in search: {str(e)}")
        return {
            'statusCode': 500,
            'error': f'Unexpected error: {str(e)}',
            'results': [],
            'summary': {'error': 'Unexpected error'}
        }

def check_duplicates(
    vector_bucket: str,
    index_name: str,
    query_embedding: List[float],
    top_k: int,
    filters: Dict[str, Any],
    duplicate_threshold: float
) -> Dict[str, Any]:
    """
    Check for duplicate content using embedding similarity
    """
    
    try:
        # For now, simulate duplicate check since we can't directly query with embeddings
        # In real implementation, this would use the embedding directly
        print(f"🔄 Duplicate check - threshold: {duplicate_threshold}")
        
        # Simulate duplicate detection logic
        # This is a placeholder - real implementation would compare embeddings
        return {
            'statusCode': 200,
            'isDuplicate': False,
            'maxSimilarity': 0.75,
            'duplicateKey': None,
            'message': 'Duplicate check completed (simulated)'
        }
        
    except Exception as e:
        print(f"❌ Error in duplicate check: {str(e)}")
        return {
            'statusCode': 500,
            'isDuplicate': False,
            'maxSimilarity': 0.0,
            'error': str(e)
        }

def validate_cefr_level(
    vector_bucket: str,
    index_name: str,
    query_embedding: List[float],
    target_level: str,
    top_k: int,
    filters: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validate if content matches intended CEFR level
    """
    
    try:
        print(f"🎯 Level validation - target: {target_level}")
        
        # Simulate level validation logic
        # Real implementation would compare against canonical level embeddings
        level_confidence = 0.85
        suggested_level = target_level
        
        # Simulate some validation logic
        if target_level in ['A1', 'A2']:
            level_match = True
        else:
            level_match = True  # For now, assume match
            
        return {
            'statusCode': 200,
            'levelMatch': level_match,
            'confidence': level_confidence,
            'suggestedLevel': suggested_level,
            'targetLevel': target_level,
            'message': 'Level validation completed (simulated)'
        }
        
    except Exception as e:
        print(f"❌ Error in level validation: {str(e)}")
        return {
            'statusCode': 500,
            'levelMatch': True,
            'confidence': 0.0,
            'suggestedLevel': target_level,
            'error': str(e)
        }

# Test function for local development
if __name__ == "__main__":
    # Test event
    test_event = {
        "action": "search_similar",
        "vectorBucket": "intellilearn-vectors",
        "indexName": "courses-semantic-index",
        "queryText": "English A2 lesson about greetings and introductions",
        "topK": 3,
        "filters": {
            "cefr_level": "A2",
            "language": "English",
            "artifact_type": "lesson_plan"
        },
        "returnDistance": True,
        "returnMetadata": True
    }
    
    result = lambda_handler(test_event, None)
    print("🧪 Test Result:")
    print(json.dumps(result, indent=2))
