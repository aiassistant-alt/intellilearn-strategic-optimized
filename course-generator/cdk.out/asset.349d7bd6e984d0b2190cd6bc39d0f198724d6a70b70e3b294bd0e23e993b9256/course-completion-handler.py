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
    """Handle content generation - Demo version with simulated content"""
    try:
        # Extract parameters
        language = event['language']
        level = event['level']
        role = event['currentRole']
        prompt = event['prompt']
        
        logger.info(f"🎓 Generating content for {role}: {language} {level}")
        
        # Simulate content generation based on role
        if role == "Course Planner":
            generated_content = f"""
# {language} {level} Course Outline

## Course Overview
This comprehensive {language} course is designed for {level} level learners following CEFR standards.

## Learning Objectives
- Develop fundamental {language} communication skills
- Master essential grammar structures for {level} level
- Build vocabulary of 500+ common words
- Practice pronunciation and listening comprehension
- Understand cultural context and customs

## Module Structure
### Module 1: Greetings and Introductions (Weeks 1-2)
- Basic greetings and farewells
- Personal information exchange
- Numbers and time

### Module 2: Daily Activities (Weeks 3-4)
- Present tense verbs
- Daily routines vocabulary
- Asking for information

### Module 3: Food and Shopping (Weeks 5-6)
- Food vocabulary
- Shopping expressions
- Quantities and prices

### Module 4: Travel and Directions (Weeks 7-8)
- Transportation vocabulary
- Giving and asking for directions
- Past tense introduction

## Assessment Strategy
- Weekly vocabulary quizzes
- Speaking practice sessions with Nova Sonic AI
- Mid-course progress evaluation
- Final comprehensive assessment
"""
        
        elif role == "Curriculum Designer":
            generated_content = f"""
# {language} {level} Curriculum - Detailed Module Content

## Module 1: Greetings and Introductions

### Learning Outcomes
Students will be able to:
- Greet people appropriately in formal and informal contexts
- Introduce themselves and others
- Ask and answer basic personal information questions

### Grammar Focus
- Present tense of "to be"
- Question formation (What, Where, How)
- Personal pronouns

### Vocabulary (50 words)
- Greetings: hello, goodbye, good morning, good evening
- Personal info: name, age, country, job, family
- Numbers: 1-100

### Interactive Activities for Voice AI
1. **Greeting Practice**: Students practice different greetings with Nova Sonic
2. **Personal Introduction**: Role-play introducing yourself to new people
3. **Number Games**: Practice numbers through interactive counting exercises

### Cultural Insights
- Appropriate greeting customs in {language}-speaking countries
- Formal vs informal address
- Business card etiquette

### Lesson Plans
**Lesson 1.1: Basic Greetings (90 minutes)**
- Warm-up: Listen and repeat greetings
- Presentation: Formal vs informal greetings
- Practice: Pair work with Nova Sonic
- Production: Create personal greeting video

**Lesson 1.2: Personal Information (90 minutes)**
- Review: Previous lesson vocabulary
- New content: Personal information questions
- Controlled practice: Q&A with AI tutor
- Free practice: Speed networking activity
"""
        
        elif role == "Exercise Designer":
            generated_content = f"""
# {language} {level} Practice Exercises - Module 1

## Exercise Set 1: Multiple Choice Questions

### Question 1
What is the appropriate response to "How are you?"
a) I'm fine, thank you
b) Yes, please
c) My name is John
d) I'm from Spain

**Answer: a) I'm fine, thank you**
**Explanation**: This is the standard polite response to asking about someone's wellbeing.

### Question 2
Which greeting is most formal?
a) Hi there!
b) Hey!
c) Good morning, Mr. Smith
d) What's up?

**Answer: c) Good morning, Mr. Smith**
**Explanation**: Using title + surname is the most formal greeting style.

## Exercise Set 2: Fill-in-the-Blank

Complete the conversation:
A: Hello, my _____ is Maria. What's _____ name?
B: Nice to _____ you, Maria. I'm David.
A: _____ to meet you too, David.

**Answers**: name, your, meet, Nice

## Exercise Set 3: Voice Practice with Nova Sonic

### Conversation Scenario 1: Meeting Someone New
**Student role**: You're at a coffee shop and meet someone new
**Nova Sonic role**: Friendly person wanting to chat
**Objectives**: Practice greetings, introductions, basic questions

### Conversation Scenario 2: Job Interview Introduction
**Student role**: Job candidate
**Nova Sonic role**: Interviewer
**Objectives**: Formal greetings, professional self-introduction

## Exercise Set 4: Listening Comprehension

Students will listen to Nova Sonic speak and answer questions:
1. What is the speaker's name?
2. Where is the speaker from?
3. What is the speaker's job?

## Exercise Set 5: Writing Prompts

1. Write a short introduction about yourself (50 words)
2. Create a dialogue between two people meeting for the first time
3. Describe your daily routine using present tense verbs

**Answer Keys and Rubrics Provided**
"""
        
        elif role == "Assessment Specialist":
            generated_content = f"""
# {language} {level} Assessment Methods

## 1. Diagnostic Pre-Assessment

### Purpose
Evaluate students' current {language} proficiency before course begins

### Format
- 20-minute online assessment
- Multiple choice and short answer questions
- Voice recording sample (2 minutes)

### Content Areas
- Basic vocabulary recognition
- Grammar structure understanding
- Pronunciation assessment
- Listening comprehension

### Scoring
- 0-25 points: True beginner
- 26-50 points: False beginner
- 51-75 points: Above {level} level (recommend higher course)

## 2. Module Quizzes

### Weekly Assessment Structure
**Week 1-2 Quiz: Greetings & Introductions**
- Vocabulary matching (10 points)
- Grammar completion (10 points)
- Voice recording with Nova Sonic (10 points)
- Total: 30 points

### Voice Assessment Criteria with Nova Sonic
- **Pronunciation** (1-5 scale): Clarity and accuracy
- **Fluency** (1-5 scale): Natural speech rhythm
- **Comprehension** (1-5 scale): Understanding AI responses
- **Interaction** (1-5 scale): Appropriate responses

## 3. Mid-Course Progress Evaluation

### Format
- 45-minute comprehensive assessment
- Written component (60%)
- Oral component with Nova Sonic (40%)

### CEFR Alignment for {level} Level
**Can Do Statements:**
- Can introduce themselves and others
- Can ask and answer simple personal questions
- Can interact in a simple way with Nova Sonic AI tutor
- Can understand familiar everyday expressions

## 4. Final Assessment

### Comprehensive Evaluation
- **Written Test** (40%): Grammar, vocabulary, reading comprehension
- **Oral Interview with Nova Sonic** (35%): 15-minute conversation
- **Portfolio Review** (25%): Weekly assignments and progress

### Voice Pronunciation Assessment Criteria
**Excellent (5)**: Native-like pronunciation, easily understood
**Good (4)**: Minor accent, generally clear
**Satisfactory (3)**: Understandable with some effort
**Needs Improvement (2)**: Difficult to understand
**Unsatisfactory (1)**: Very difficult to understand

## 5. Self-Evaluation Tools

### Weekly Reflection Questions
1. What new vocabulary did I learn this week?
2. Which grammar point was most challenging?
3. How comfortable am I speaking with Nova Sonic?
4. What cultural insight surprised me most?

### Progress Tracking
Students maintain a learning journal with:
- Daily vocabulary log
- Voice practice recordings
- Cultural observations
- Goal setting and reflection

**All assessments align with CEFR {level} level descriptors and support personalized learning paths.**
"""
        
        else:
            generated_content = f"Generated content for {role} role in {language} {level} course."
        
        logger.info(f"✅ Generated {len(generated_content)} characters for {role}")
        
        return {
            'role': role,
            'content': generated_content,
            'language': language,
            'level': level,
            'timestamp': datetime.utcnow().isoformat(),
            'method': 'simulated_generation'
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
