"""
^CourseGeneratorAPI
Author: Luis Arturo Parra - Telmo AI
Created: 2025-09-13
Usage: REST API Lambda function for triggering course generation from Intellilearn platform
Business Context: Provides HTTP endpoints for course generation requests and status checks
Relations: Step Functions state machine, API Gateway, Intellilearn platform
Reminders: Handles authentication and validation for course generation requests
Security: Validates requests and uses IAM roles for Step Functions access
"""

import json
import boto3
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import uuid
import os

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
stepfunctions = boto3.client('stepfunctions')
dynamodb = boto3.resource('dynamodb')

# Configuration
STATE_MACHINE_ARN = os.environ.get('STATE_MACHINE_ARN', 
    'arn:aws:states:us-east-1:076276934311:stateMachine:intellilearn-course-generator')
REQUESTS_TABLE = os.environ.get('REQUESTS_TABLE', 'intellilearn-course-requests')

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
}

def lambda_handler(event, context):
    """
    Main Lambda handler for course generator API
    
    Supported endpoints:
    - POST /generate - Start course generation
    - GET /status/{executionId} - Check generation status  
    - GET /executions - List recent executions
    - GET /courses - List generated courses
    """
    
    try:
        logger.info(f"🚀 API Request: {json.dumps(event, default=str)}")
        
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return create_response(200, {'message': 'CORS preflight'})
        
        # Route request
        method = event.get('httpMethod')
        path = event.get('path', '')
        
        if method == 'POST' and path == '/generate':
            return handle_generate_course(event)
        elif method == 'GET' and '/status/' in path:
            execution_id = path.split('/status/')[-1]
            return handle_get_status(execution_id)
        elif method == 'GET' and path == '/executions':
            return handle_list_executions(event)
        elif method == 'GET' and path == '/courses':
            return handle_list_courses(event)
        else:
            return create_response(404, {'error': 'Endpoint not found'})
            
    except Exception as e:
        logger.error(f"❌ API Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error', 'details': str(e)})

def handle_generate_course(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle POST /generate - Start course generation"""
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate required fields
        required_fields = ['language', 'level']
        for field in required_fields:
            if field not in body:
                return create_response(400, {'error': f'Missing required field: {field}'})
        
        # Validate CEFR level
        valid_levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        if body['level'].upper() not in valid_levels:
            return create_response(400, {
                'error': f'Invalid level: {body["level"]}. Valid levels: {valid_levels}'
            })
        
        # Prepare course generation request
        course_request = {
            'language': body['language'],
            'level': body['level'].upper(),
            'courseType': body.get('courseType', 'standard'),
            'duration': body.get('duration', 12),
            'requestedBy': body.get('userId', 'anonymous'),
            'requestId': str(uuid.uuid4())
        }
        
        # Generate execution name
        execution_name = f"course-gen-{course_request['language'].lower()}-{course_request['level'].lower()}-{int(datetime.utcnow().timestamp())}"
        
        # Start Step Functions execution
        response = stepfunctions.start_execution(
            stateMachineArn=STATE_MACHINE_ARN,
            name=execution_name,
            input=json.dumps(course_request)
        )
        
        # Store request in DynamoDB for tracking
        request_record = {
            'requestId': course_request['requestId'],
            'executionArn': response['executionArn'],
            'executionName': execution_name,
            'language': course_request['language'],
            'level': course_request['level'],
            'courseType': course_request['courseType'],
            'duration': course_request['duration'],
            'requestedBy': course_request['requestedBy'],
            'status': 'RUNNING',
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat()
        }
        
        # Store in DynamoDB (optional - for tracking)
        try:
            table = dynamodb.Table(REQUESTS_TABLE)
            table.put_item(Item=request_record)
        except Exception as e:
            logger.warning(f"⚠️ Could not store request record: {str(e)}")
        
        logger.info(f"✅ Course generation started: {execution_name}")
        
        return create_response(202, {
            'message': 'Course generation started',
            'requestId': course_request['requestId'],
            'executionName': execution_name,
            'executionArn': response['executionArn'],
            'estimatedDuration': '10-15 minutes',
            'statusEndpoint': f'/status/{execution_name}',
            'courseRequest': course_request
        })
        
    except json.JSONDecodeError:
        return create_response(400, {'error': 'Invalid JSON in request body'})
    except Exception as e:
        logger.error(f"❌ Error starting course generation: {str(e)}")
        return create_response(500, {'error': 'Failed to start course generation', 'details': str(e)})

def handle_get_status(execution_name: str) -> Dict[str, Any]:
    """Handle GET /status/{executionId} - Check generation status"""
    
    try:
        execution_arn = f"arn:aws:states:us-east-1:076276934311:execution:intellilearn-course-generator:{execution_name}"
        
        # Get execution details
        execution = stepfunctions.describe_execution(executionArn=execution_arn)
        
        # Calculate duration if completed
        duration = None
        if execution.get('stopDate'):
            start = execution['startDate']
            stop = execution['stopDate']
            duration = int((stop - start).total_seconds())
        
        # Parse input and output
        input_data = json.loads(execution['input'])
        output_data = None
        
        if execution['status'] == 'SUCCEEDED' and execution.get('output'):
            try:
                output_data = json.loads(execution['output'])
            except json.JSONDecodeError:
                pass
        
        response_data = {
            'executionName': execution_name,
            'status': execution['status'],
            'startDate': execution['startDate'].isoformat(),
            'stopDate': execution.get('stopDate').isoformat() if execution.get('stopDate') else None,
            'duration': duration,
            'courseRequest': input_data,
            'result': output_data
        }
        
        # Add progress information for running executions
        if execution['status'] == 'RUNNING':
            response_data['estimatedTimeRemaining'] = '5-10 minutes'
            response_data['currentStep'] = 'Generating course content...'
        
        return create_response(200, response_data)
        
    except stepfunctions.exceptions.ExecutionDoesNotExist:
        return create_response(404, {'error': 'Execution not found'})
    except Exception as e:
        logger.error(f"❌ Error getting execution status: {str(e)}")
        return create_response(500, {'error': 'Failed to get execution status', 'details': str(e)})

def handle_list_executions(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle GET /executions - List recent executions"""
    
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        max_results = int(query_params.get('limit', 20))
        status_filter = query_params.get('status')
        
        # List executions
        list_params = {
            'stateMachineArn': STATE_MACHINE_ARN,
            'maxResults': min(max_results, 100)  # Cap at 100
        }
        
        if status_filter:
            list_params['statusFilter'] = status_filter.upper()
        
        executions = stepfunctions.list_executions(**list_params)
        
        # Format response
        execution_list = []
        for exec in executions['executions']:
            execution_data = {
                'name': exec['name'],
                'status': exec['status'],
                'startDate': exec['startDate'].isoformat(),
                'stopDate': exec.get('stopDate').isoformat() if exec.get('stopDate') else None
            }
            
            # Parse input for course details
            try:
                input_data = json.loads(exec['input'])
                execution_data['language'] = input_data.get('language')
                execution_data['level'] = input_data.get('level')
                execution_data['courseType'] = input_data.get('courseType')
            except:
                pass
            
            execution_list.append(execution_data)
        
        return create_response(200, {
            'executions': execution_list,
            'count': len(execution_list),
            'hasMore': len(executions['executions']) == max_results
        })
        
    except Exception as e:
        logger.error(f"❌ Error listing executions: {str(e)}")
        return create_response(500, {'error': 'Failed to list executions', 'details': str(e)})

def handle_list_courses(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle GET /courses - List generated courses"""
    
    try:
        # This would query the course catalog from DynamoDB
        # For now, return a placeholder response
        
        return create_response(200, {
            'courses': [],
            'message': 'Course listing not yet implemented',
            'note': 'Generated courses are stored in S3 and integrated into the main Intellilearn catalog'
        })
        
    except Exception as e:
        logger.error(f"❌ Error listing courses: {str(e)}")
        return create_response(500, {'error': 'Failed to list courses', 'details': str(e)})

def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create standardized API response"""
    
    response = {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            **body,
            'timestamp': datetime.utcnow().isoformat(),
            'apiVersion': '1.0'
        }, default=str)
    }
    
    return response

def validate_course_request(request: Dict[str, Any]) -> Optional[str]:
    """Validate course generation request"""
    
    # Language validation
    supported_languages = [
        'English', 'Spanish', 'French', 'German', 'Italian', 
        'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic'
    ]
    
    if request.get('language') not in supported_languages:
        return f"Unsupported language. Supported: {supported_languages}"
    
    # Course type validation
    valid_types = ['standard', 'intensive', 'business', 'conversation', 'academic']
    if request.get('courseType', 'standard') not in valid_types:
        return f"Invalid course type. Valid types: {valid_types}"
    
    # Duration validation
    duration = request.get('duration', 12)
    if not isinstance(duration, int) or duration < 4 or duration > 52:
        return "Duration must be between 4 and 52 weeks"
    
    return None
