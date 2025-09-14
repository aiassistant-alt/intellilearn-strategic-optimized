"""
^CourseCompletionHandler
Author: Luis Arturo Parra - Telmo AI
Created: 2025-09-13
Usage: Lambda function to handle course generation completion notifications
Business Context: Integrates generated courses into Intellilearn platform catalog
Relations: Step Functions workflow, DynamoDB course catalog, SNS notifications
Reminders: Updates course availability and triggers platform notifications
Security: Uses IAM roles for DynamoDB and SNS access
"""

import json
import boto3
import logging
from datetime import datetime
from typing import Dict, Any
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
s3 = boto3.client('s3')

# Configuration
COURSE_TABLE_NAME = 'intellilearn-data-prod'
SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:076276934311:intellilearn-course-notifications'

def lambda_handler(event, context):
    """
    Handle course generation and completion tasks
    
    Args:
        event: Task data from Step Functions
        context: Lambda execution context
        
    Returns:
        Dict with processing results
    """
    try:
        logger.info(f"🎓 Processing request: {json.dumps(event, indent=2)}")
        
        # Check action type
        action = event.get('action', 'notify_completion')
        
        if action == 'generate_content':
            return handle_content_generation(event)
        elif action == 'notify_completion':
            return handle_completion_notification(event)
        else:
            raise ValueError(f"Unknown action: {action}")
        
    except Exception as e:
        logger.error(f"❌ Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'body': {
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
        }

def handle_content_generation(event):
    """Handle content generation using Bedrock"""
    try:
        # Initialize Bedrock client
        bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
        
        # Prepare prompt
        language = event['language']
        level = event['level']
        role = event['currentRole']
        prompt = event['prompt']
        
        full_prompt = f"""Language: {language}
Level: {level}
Role: {role}

Task: {prompt}

Please provide detailed, structured content for this {language} {level} course following the {role} requirements."""

        # Call Claude via Bedrock
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 4000,
                'temperature': 0.7,
                'messages': [
                    {
                        'role': 'user',
                        'content': full_prompt
                    }
                ]
            })
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        generated_content = response_body['content'][0]['text']
        
        logger.info(f"✅ Generated content for {role}: {len(generated_content)} characters")
        
        return {
            'role': role,
            'content': generated_content,
            'language': language,
            'level': level,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating content: {str(e)}")
        raise

def handle_completion_notification(event):
    """Handle course completion notification"""
    try:
        # Extract course data
        course_data = extract_course_data(event)
        
        # Store course in DynamoDB catalog
        course_record = create_course_record(course_data)
        store_course_catalog(course_record)
        
        # Send platform notification
        send_completion_notification(course_data)
        
        logger.info(f"✅ Course {course_data['courseId']} successfully integrated into platform")
        
        return {
            'status': 'success',
            'courseId': course_data['courseId'],
            'message': 'Course successfully integrated into Intellilearn platform',
            'catalogEntry': course_record['id'],
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error processing course completion: {str(e)}")
        send_error_notification(event, str(e))
        raise

def extract_course_data(event: Dict[str, Any]) -> Dict[str, Any]:
    """Extract and validate course data from Step Functions event"""
    
    required_fields = ['courseId', 'language', 'level', 's3Location', 'generatedAt']
    
    for field in required_fields:
        if field not in event:
            raise ValueError(f"Missing required field: {field}")
    
    return {
        'courseId': event['courseId'],
        'language': event['language'],
        'level': event['level'],
        'courseType': event.get('courseType', 'standard'),
        'duration': event.get('duration', 12),
        's3Location': event['s3Location'],
        'embeddingLocation': event.get('embeddingLocation'),
        'generatedAt': event['generatedAt'],
        'status': event.get('status', 'completed')
    }

def create_course_record(course_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a course record compatible with Intellilearn platform structure"""
    
    course_id = str(uuid.uuid4())
    
    # Generate course title and description
    title = f"{course_data['language']} Course - {course_data['level']} Level"
    description = f"Auto-generated {course_data['language']} course for {course_data['level']} proficiency level. Duration: {course_data['duration']} weeks."
    
    # Create course record matching Intellilearn schema
    course_record = {
        'id': course_id,
        'type': 'course',
        'title': title,
        'description': description,
        'language': course_data['language'],
        'level': course_data['level'],
        'courseType': course_data['courseType'],
        'duration': f"{course_data['duration']} weeks",
        'difficulty': map_level_to_difficulty(course_data['level']),
        'category': 'Language Learning',
        'tags': [
            course_data['language'].lower(),
            course_data['level'].lower(),
            'auto-generated',
            'voice-ai-compatible'
        ],
        'status': 'available',
        'generatedCourse': True,
        'sourceData': {
            'stepFunctionsCourseId': course_data['courseId'],
            's3Location': course_data['s3Location'],
            'embeddingLocation': course_data['embeddingLocation'],
            'generatedAt': course_data['generatedAt']
        },
        'modules': [],  # Will be populated from S3 content
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat(),
        'createdBy': 'system-auto-generator',
        'version': '1.0'
    }
    
    return course_record

def map_level_to_difficulty(level: str) -> str:
    """Map CEFR levels to Intellilearn difficulty levels"""
    level_mapping = {
        'A1': 'Beginner',
        'A2': 'Elementary', 
        'B1': 'Intermediate',
        'B2': 'Upper Intermediate',
        'C1': 'Advanced',
        'C2': 'Proficient'
    }
    return level_mapping.get(level.upper(), 'Intermediate')

def store_course_catalog(course_record: Dict[str, Any]) -> None:
    """Store course record in DynamoDB catalog"""
    
    try:
        table = dynamodb.Table(COURSE_TABLE_NAME)
        
        # Store main course record
        table.put_item(Item=course_record)
        
        logger.info(f"📚 Course record stored in catalog: {course_record['id']}")
        
    except Exception as e:
        logger.error(f"❌ Failed to store course in catalog: {str(e)}")
        raise

def send_completion_notification(course_data: Dict[str, Any]) -> None:
    """Send SNS notification about course completion"""
    
    try:
        message = {
            'event': 'course_generation_completed',
            'courseId': course_data['courseId'],
            'language': course_data['language'],
            'level': course_data['level'],
            'title': f"{course_data['language']} Course - {course_data['level']} Level",
            'status': 'available',
            'generatedAt': course_data['generatedAt'],
            'platform': 'Intellilearn'
        }
        
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"🎓 New Course Available: {course_data['language']} {course_data['level']}",
            Message=json.dumps(message, indent=2),
            MessageAttributes={
                'event_type': {
                    'DataType': 'String',
                    'StringValue': 'course_completion'
                },
                'language': {
                    'DataType': 'String', 
                    'StringValue': course_data['language']
                },
                'level': {
                    'DataType': 'String',
                    'StringValue': course_data['level']
                }
            }
        )
        
        logger.info(f"📧 Completion notification sent for course {course_data['courseId']}")
        
    except Exception as e:
        logger.error(f"❌ Failed to send completion notification: {str(e)}")
        # Don't raise - notification failure shouldn't break the process

def send_error_notification(event: Dict[str, Any], error_message: str) -> None:
    """Send error notification"""
    
    try:
        message = {
            'event': 'course_generation_failed',
            'error': error_message,
            'originalEvent': event,
            'timestamp': datetime.utcnow().isoformat(),
            'platform': 'Intellilearn'
        }
        
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="❌ Course Generation Failed",
            Message=json.dumps(message, indent=2),
            MessageAttributes={
                'event_type': {
                    'DataType': 'String',
                    'StringValue': 'course_generation_error'
                }
            }
        )
        
    except Exception as e:
        logger.error(f"❌ Failed to send error notification: {str(e)}")

def update_course_status(course_id: str, status: str) -> None:
    """Update course status in the catalog"""
    
    try:
        table = dynamodb.Table(COURSE_TABLE_NAME)
        
        table.update_item(
            Key={'id': course_id, 'type': 'course'},
            UpdateExpression='SET #status = :status, updatedAt = :updated',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': status,
                ':updated': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"📊 Course status updated: {course_id} -> {status}")
        
    except Exception as e:
        logger.error(f"❌ Failed to update course status: {str(e)}")
        # Don't raise - status update failure shouldn't break the process
