/**
 * ^StartExecution
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-13
 * Usage: Script to start Step Functions execution for course generation
 * Business Context: Utility to trigger course generation from command line or API
 * Relations: Step Functions state machine, AWS SDK
 * Reminders: Requires AWS credentials and proper permissions
 * Security: Uses AWS SDK with configured credentials
 */

const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1'
});

const stepfunctions = new AWS.StepFunctions();

// 🎯 Course generation parameters
const courseRequests = {
  // Basic language courses
  englishA1: {
    language: 'English',
    level: 'A1',
    courseType: 'standard',
    duration: 8
  },
  spanishA2: {
    language: 'Spanish', 
    level: 'A2',
    courseType: 'standard',
    duration: 10
  },
  frenchB1: {
    language: 'French',
    level: 'B1', 
    courseType: 'intensive',
    duration: 12
  },
  germanB2: {
    language: 'German',
    level: 'B2',
    courseType: 'standard',
    duration: 16
  },
  // Business language courses
  businessEnglish: {
    language: 'English',
    level: 'B2',
    courseType: 'business',
    duration: 14
  },
  // Conversation focused courses
  conversationalSpanish: {
    language: 'Spanish',
    level: 'B1',
    courseType: 'conversation',
    duration: 10
  }
};

async function startCourseGeneration(courseKey) {
  try {
    const courseRequest = courseRequests[courseKey];
    
    if (!courseRequest) {
      console.error(`❌ Unknown course key: ${courseKey}`);
      console.log(`Available courses: ${Object.keys(courseRequests).join(', ')}`);
      return;
    }

    console.log(`🚀 Starting course generation for: ${courseRequest.language} ${courseRequest.level}`);
    console.log(`📋 Parameters:`, JSON.stringify(courseRequest, null, 2));

    const params = {
      stateMachineArn: `arn:aws:states:us-east-1:076276934311:stateMachine:intellilearn-course-generator`,
      input: JSON.stringify(courseRequest),
      name: `course-gen-${courseRequest.language.toLowerCase()}-${courseRequest.level.toLowerCase()}-${Date.now()}`
    };

    const result = await stepfunctions.startExecution(params).promise();
    
    console.log(`✅ Execution started successfully!`);
    console.log(`🆔 Execution ARN: ${result.executionArn}`);
    console.log(`⏰ Started at: ${result.startDate}`);
    console.log(`\n📊 Monitor execution:`);
    console.log(`   AWS Console: https://console.aws.amazon.com/states/home?region=us-east-1#/executions/details/${result.executionArn}`);
    console.log(`\n🔍 Check status: npm run check-execution -- ${result.executionArn.split(':').pop()}`);

    return result;

  } catch (error) {
    console.error(`❌ Error starting execution:`, error.message);
    
    if (error.code === 'StateMachineDoesNotExist') {
      console.log(`\n💡 Tip: Deploy the infrastructure first:`);
      console.log(`   npm run deploy:dev`);
    }
    
    throw error;
  }
}

// 📋 Command line interface
async function main() {
  const courseKey = process.argv[2];
  
  if (!courseKey) {
    console.log(`🎓 Intellilearn Course Generator`);
    console.log(`\n📚 Usage: npm run start-execution -- <course-key>`);
    console.log(`\n🗂️  Available courses:`);
    
    Object.entries(courseRequests).forEach(([key, course]) => {
      console.log(`   ${key.padEnd(20)} - ${course.language} ${course.level} (${course.courseType}, ${course.duration} weeks)`);
    });
    
    console.log(`\n🚀 Examples:`);
    console.log(`   npm run start-execution -- englishA1`);
    console.log(`   npm run start-execution -- businessEnglish`);
    console.log(`   npm run start-execution -- conversationalSpanish`);
    
    return;
  }

  try {
    await startCourseGeneration(courseKey);
  } catch (error) {
    process.exit(1);
  }
}

// 🎯 Export for programmatic use
module.exports = {
  startCourseGeneration,
  courseRequests
};

// 🚀 Run if called directly
if (require.main === module) {
  main();
}
