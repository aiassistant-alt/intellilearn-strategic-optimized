/**
 * ^CheckExecution
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-13
 * Usage: Script to check Step Functions execution status and results
 * Business Context: Monitor course generation progress and retrieve results
 * Relations: Step Functions state machine, S3 storage, AWS SDK
 * Reminders: Provides detailed execution logs and error handling
 * Security: Uses AWS SDK with configured credentials
 */

const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1'
});

const stepfunctions = new AWS.StepFunctions();
const s3 = new AWS.S3();

async function checkExecution(executionName) {
  try {
    const executionArn = `arn:aws:states:us-east-1:076276934311:execution:intellilearn-course-generator:${executionName}`;
    
    console.log(`🔍 Checking execution: ${executionName}`);
    console.log(`🆔 Full ARN: ${executionArn}`);

    // Get execution details
    const execution = await stepfunctions.describeExecution({
      executionArn: executionArn
    }).promise();

    console.log(`\n📊 Execution Status: ${getStatusEmoji(execution.status)} ${execution.status}`);
    console.log(`⏰ Started: ${execution.startDate}`);
    
    if (execution.stopDate) {
      console.log(`🏁 Stopped: ${execution.stopDate}`);
      const duration = (new Date(execution.stopDate) - new Date(execution.startDate)) / 1000;
      console.log(`⏱️  Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`);
    }

    // Parse input
    const input = JSON.parse(execution.input);
    console.log(`\n📋 Course Request:`);
    console.log(`   Language: ${input.language}`);
    console.log(`   Level: ${input.level}`);
    console.log(`   Type: ${input.courseType || 'standard'}`);
    console.log(`   Duration: ${input.duration || 'N/A'} weeks`);

    // Get execution history for detailed progress
    const history = await stepfunctions.getExecutionHistory({
      executionArn: executionArn,
      maxResults: 100,
      reverseOrder: true
    }).promise();

    console.log(`\n📈 Execution Progress:`);
    displayExecutionProgress(history.events);

    // If completed successfully, show results
    if (execution.status === 'SUCCEEDED') {
      await displaySuccessResults(execution);
    } else if (execution.status === 'FAILED') {
      await displayFailureDetails(history.events);
    }

    return execution;

  } catch (error) {
    console.error(`❌ Error checking execution:`, error.message);
    
    if (error.code === 'ExecutionDoesNotExist') {
      console.log(`\n💡 Tip: Check the execution name or start a new execution:`);
      console.log(`   npm run start-execution -- englishA1`);
    }
    
    throw error;
  }
}

function getStatusEmoji(status) {
  const statusEmojis = {
    'RUNNING': '🔄',
    'SUCCEEDED': '✅',
    'FAILED': '❌',
    'TIMED_OUT': '⏰',
    'ABORTED': '🛑'
  };
  return statusEmojis[status] || '❓';
}

function displayExecutionProgress(events) {
  const relevantEvents = events.filter(event => 
    event.type.includes('StateEntered') || 
    event.type.includes('StateExited') ||
    event.type.includes('TaskFailed') ||
    event.type.includes('ExecutionFailed')
  ).reverse();

  relevantEvents.forEach(event => {
    const timestamp = event.timestamp.toISOString().substr(11, 8);
    
    if (event.type === 'StateEntered') {
      const stateName = event.stateEnteredEventDetails?.name;
      console.log(`   ${timestamp} 🔄 Entered: ${stateName}`);
    } else if (event.type === 'StateExited') {
      const stateName = event.stateExitedEventDetails?.name;
      console.log(`   ${timestamp} ✅ Completed: ${stateName}`);
    } else if (event.type.includes('Failed')) {
      const error = event.taskFailedEventDetails || event.executionFailedEventDetails;
      console.log(`   ${timestamp} ❌ Failed: ${error?.error || 'Unknown error'}`);
    }
  });
}

async function displaySuccessResults(execution) {
  try {
    const output = JSON.parse(execution.output);
    
    console.log(`\n🎉 Course Generation Completed Successfully!`);
    console.log(`\n📁 Generated Content:`);
    console.log(`   Course ID: ${output.courseId}`);
    console.log(`   S3 Location: s3://intellilearn-generated-courses-076276934311/${output.s3Location}`);
    
    if (output.embeddingLocation) {
      console.log(`   Embedding: s3://intellilearn-vectors-076276934311/${output.embeddingLocation}`);
    }

    console.log(`\n🔗 Quick Access:`);
    console.log(`   Download course: aws s3 cp s3://intellilearn-generated-courses-076276934311/${output.s3Location} ./generated-course.json`);
    console.log(`   View in S3: https://s3.console.aws.amazon.com/s3/object/intellilearn-generated-courses-076276934311?prefix=${output.s3Location}`);

  } catch (error) {
    console.log(`\n⚠️  Could not parse execution output: ${error.message}`);
  }
}

async function displayFailureDetails(events) {
  const failureEvents = events.filter(event => 
    event.type.includes('Failed') || event.type.includes('TimedOut')
  );

  if (failureEvents.length > 0) {
    console.log(`\n💥 Failure Details:`);
    
    failureEvents.forEach(event => {
      const details = event.taskFailedEventDetails || 
                     event.lambdaFunctionFailedEventDetails ||
                     event.executionFailedEventDetails;
      
      if (details) {
        console.log(`   Error: ${details.error || 'Unknown'}`);
        console.log(`   Cause: ${details.cause || 'No details available'}`);
      }
    });

    console.log(`\n🔧 Troubleshooting Tips:`);
    console.log(`   1. Check Bedrock model access permissions`);
    console.log(`   2. Verify S3 bucket permissions`);
    console.log(`   3. Check Lambda function logs`);
    console.log(`   4. Review Step Functions execution logs in CloudWatch`);
  }
}

async function listRecentExecutions() {
  try {
    console.log(`📋 Recent Course Generation Executions:`);
    
    const executions = await stepfunctions.listExecutions({
      stateMachineArn: `arn:aws:states:us-east-1:076276934311:stateMachine:intellilearn-course-generator`,
      maxResults: 10
    }).promise();

    if (executions.executions.length === 0) {
      console.log(`   No executions found.`);
      return;
    }

    executions.executions.forEach(exec => {
      const name = exec.name;
      const status = `${getStatusEmoji(exec.status)} ${exec.status}`;
      const startTime = exec.startDate.toISOString().substr(0, 19).replace('T', ' ');
      
      console.log(`   ${name.padEnd(40)} ${status.padEnd(12)} ${startTime}`);
    });

    console.log(`\n🔍 Check specific execution: npm run check-execution -- <execution-name>`);

  } catch (error) {
    console.error(`❌ Error listing executions:`, error.message);
  }
}

// 📋 Command line interface
async function main() {
  const executionName = process.argv[2];
  
  if (!executionName) {
    console.log(`🎓 Intellilearn Course Generator - Execution Checker`);
    console.log(`\n📊 Usage: npm run check-execution -- <execution-name>`);
    console.log(`\n🔍 Example: npm run check-execution -- course-gen-english-a1-1694612345678`);
    
    await listRecentExecutions();
    return;
  }

  try {
    await checkExecution(executionName);
  } catch (error) {
    process.exit(1);
  }
}

// 🎯 Export for programmatic use
module.exports = {
  checkExecution,
  listRecentExecutions
};

// 🚀 Run if called directly
if (require.main === module) {
  main();
}
