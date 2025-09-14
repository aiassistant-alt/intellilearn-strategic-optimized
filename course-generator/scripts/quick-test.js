#!/usr/bin/env node

/**
 * ^QuickCourseTest
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-01-13
 * Usage: Quick test for single course generation
 * Business Context: Fast validation of course generation workflow
 * Relations: Step Functions, Lambda, Bedrock
 * Reminders: Use for rapid testing during development
 */

const AWS = require('aws-sdk');

// Configuration
const REGION = 'us-east-1';
const STATE_MACHINE_ARN = 'arn:aws:states:us-east-1:076276934311:stateMachine:intellilearn-course-generator';

// Initialize AWS client
AWS.config.update({ region: REGION });
const stepfunctions = new AWS.StepFunctions();

/**
 * Quick test with command line arguments
 */
async function quickTest() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    let language = 'English';
    let level = 'A1';
    let courseType = 'General';
    let duration = 8;
    
    // Parse arguments
    for (let i = 0; i < args.length; i++) {
        switch(args[i]) {
            case '--language':
            case '-l':
                language = args[i + 1];
                i++;
                break;
            case '--level':
            case '-v':
                level = args[i + 1];
                i++;
                break;
            case '--type':
            case '-t':
                courseType = args[i + 1];
                i++;
                break;
            case '--duration':
            case '-d':
                duration = parseInt(args[i + 1]);
                i++;
                break;
            case '--help':
            case '-h':
                showUsage();
                return;
        }
    }
    
    const input = {
        language,
        level,
        courseType,
        duration
    };
    
    console.log('🎓 Intellilearn Quick Course Generation Test');
    console.log('=' .repeat(50));
    console.log(`📚 Language: ${language}`);
    console.log(`📊 Level: ${level}`);
    console.log(`🎯 Type: ${courseType}`);
    console.log(`⏱️  Duration: ${duration} weeks`);
    console.log('=' .repeat(50));
    
    try {
        // Start execution
        const executionName = `quick-test-${language.toLowerCase()}-${level.toLowerCase()}-${Date.now()}`;
        
        const params = {
            stateMachineArn: STATE_MACHINE_ARN,
            name: executionName,
            input: JSON.stringify(input)
        };
        
        console.log('🚀 Starting course generation...');
        const response = await stepfunctions.startExecution(params).promise();
        
        console.log('✅ Execution started successfully!');
        console.log(`🔗 Execution ARN: ${response.executionArn}`);
        console.log(`📍 Execution Name: ${executionName}`);
        
        console.log('\\n📋 Next Steps:');
        console.log('1. Monitor execution in AWS Step Functions console');
        console.log('2. Check CloudWatch logs for detailed progress');
        console.log('3. Generated course will be stored in S3: intellilearn-courses-dev');
        
        console.log('\\n🔍 Monitor with AWS CLI:');
        console.log(`aws stepfunctions describe-execution --execution-arn "${response.executionArn}"`);
        
    } catch (error) {
        console.error('❌ Error starting execution:', error.message);
        
        if (error.name === 'StateMachineDoesNotExist') {
            console.log('\\n💡 Tip: Make sure the Step Functions state machine is deployed');
            console.log('Run: npx cdk deploy --context environment=dev');
        }
        
        process.exit(1);
    }
}

/**
 * Show usage information
 */
function showUsage() {
    console.log(`
🎓 Intellilearn Quick Course Generation Test

Usage:
  node quick-test.js [options]

Options:
  -l, --language <lang>     Target language (default: English)
  -v, --level <level>       CEFR level (A1, A2, B1, B2, C1, C2) (default: A1)
  -t, --type <type>         Course type (General, Business, Conversational) (default: General)
  -d, --duration <weeks>    Course duration in weeks (default: 8)
  -h, --help               Show this help message

Examples:
  node quick-test.js
  node quick-test.js --language French --level B1
  node quick-test.js -l Spanish -v A2 -t Conversational -d 10
  node quick-test.js --language German --level B2 --type Business --duration 12

Supported Languages:
  English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean

CEFR Levels:
  A1 - Beginner
  A2 - Elementary  
  B1 - Intermediate
  B2 - Upper Intermediate
  C1 - Advanced
  C2 - Proficient
    `);
}

// Main execution
if (require.main === module) {
    quickTest()
        .then(() => {
            console.log('\\n🎉 Quick test completed!');
        })
        .catch((error) => {
            console.error('💥 Quick test failed:', error);
            process.exit(1);
        });
}

module.exports = { quickTest };
