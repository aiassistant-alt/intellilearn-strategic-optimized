#!/usr/bin/env node

/**
 * ^TestVisualWorkflow
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-01-13
 * Usage: Test script for visual Step Functions workflow with direct Bedrock integration
 * Business Context: Validates the visual course generation workflow
 * Relations: Visual Step Functions, Bedrock, S3
 * Reminders: Requires Bedrock models to be enabled in AWS console
 */

const AWS = require('aws-sdk');

// Configuration
const REGION = 'us-east-1';
const VISUAL_STATE_MACHINE_ARN = 'arn:aws:states:us-east-1:076276934311:stateMachine:intellilearn-visual-course-generator';

// Initialize AWS client
AWS.config.update({ region: REGION });
const stepfunctions = new AWS.StepFunctions();

/**
 * Test visual workflow with command line arguments
 */
async function testVisualWorkflow() {
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
    
    console.log('🎨 Intellilearn Visual Course Generation Test');
    console.log('=' .repeat(55));
    console.log(`📚 Language: ${language}`);
    console.log(`📊 Level: ${level}`);
    console.log(`🎯 Type: ${courseType}`);
    console.log(`⏱️  Duration: ${duration} weeks`);
    console.log('🔗 Direct Bedrock Integration: ✅');
    console.log('=' .repeat(55));
    
    try {
        // Start execution
        const executionName = `visual-test-${language.toLowerCase()}-${level.toLowerCase()}-${Date.now()}`;
        
        const params = {
            stateMachineArn: VISUAL_STATE_MACHINE_ARN,
            name: executionName,
            input: JSON.stringify(input)
        };
        
        console.log('🚀 Starting visual course generation workflow...');
        const response = await stepfunctions.startExecution(params).promise();
        
        console.log('✅ Visual execution started successfully!');
        console.log(`🔗 Execution ARN: ${response.executionArn}`);
        console.log(`📍 Execution Name: ${executionName}`);
        
        console.log('\\n🎨 Visual Workflow Features:');
        console.log('  • Direct Bedrock model invocation (no Lambda wrapper)');
        console.log('  • Amazon Titan Text Express for content generation');
        console.log('  • Amazon Titan Embeddings for vector storage');
        console.log('  • Visual drag-and-drop editing in AWS console');
        console.log('  • Real-time execution monitoring');
        console.log('  • Error handling with retry logic');
        
        console.log('\\n📋 Next Steps:');
        console.log('1. Open AWS Step Functions console');
        console.log('2. Find "intellilearn-visual-course-generator" state machine');
        console.log('3. View the visual workflow diagram');
        console.log('4. Monitor execution progress in real-time');
        console.log('5. Edit workflow visually by dragging components');
        
        console.log('\\n🔍 Monitor with AWS CLI:');
        console.log(`aws stepfunctions describe-execution --execution-arn "${response.executionArn}" --region ${REGION}`);
        
        console.log('\\n🌐 AWS Console Links:');
        console.log(`Step Functions: https://${REGION}.console.aws.amazon.com/states/home?region=${REGION}#/statemachines/view/${encodeURIComponent(VISUAL_STATE_MACHINE_ARN)}`);
        console.log(`Execution: https://${REGION}.console.aws.amazon.com/states/home?region=${REGION}#/executions/details/${encodeURIComponent(response.executionArn)}`);
        
    } catch (error) {
        console.error('❌ Error starting visual execution:', error.message);
        
        if (error.code === 'StateMachineDoesNotExist') {
            console.log('\\n💡 Tip: Deploy the visual state machine first');
            console.log('Run: npx cdk deploy --context environment=dev');
        } else if (error.message.includes('Bedrock') || error.message.includes('access')) {
            console.log('\\n🔓 Bedrock Access Required:');
            console.log('1. Go to AWS Bedrock Console');
            console.log('2. Enable these models:');
            console.log('   • amazon.titan-text-express-v1');
            console.log('   • amazon.titan-embed-text-v1');
            console.log('3. Run the enablement script: ./scripts/enable-bedrock-models.sh');
        }
        
        process.exit(1);
    }
}

/**
 * Show usage information
 */
function showUsage() {
    console.log(`
🎨 Intellilearn Visual Course Generation Test

This script tests the visual Step Functions workflow that directly integrates
with Amazon Bedrock for course generation. The workflow can be edited visually
in the AWS Step Functions console.

Usage:
  node test-visual-workflow.js [options]

Options:
  -l, --language <lang>     Target language (default: English)
  -v, --level <level>       CEFR level (A1, A2, B1, B2, C1, C2) (default: A1)
  -t, --type <type>         Course type (General, Business, Conversational) (default: General)
  -d, --duration <weeks>    Course duration in weeks (default: 8)
  -h, --help               Show this help message

Examples:
  node test-visual-workflow.js
  node test-visual-workflow.js --language French --level B1
  node test-visual-workflow.js -l Spanish -v A2 -t Business -d 12

Visual Workflow Features:
  ✓ Direct Bedrock integration (no Lambda wrapper)
  ✓ Drag-and-drop visual editing
  ✓ Real-time execution monitoring
  ✓ Built-in error handling and retries
  ✓ Automatic S3 storage and embedding generation

Required AWS Services:
  • Step Functions (visual workflow)
  • Bedrock (Titan models)
  • S3 (content storage)
  • Lambda (notifications)

Prerequisites:
  1. Deploy infrastructure: npx cdk deploy --context environment=dev
  2. Enable Bedrock models: ./scripts/enable-bedrock-models.sh
  3. Verify AWS credentials: aws sts get-caller-identity
    `);
}

// Main execution
if (require.main === module) {
    testVisualWorkflow()
        .then(() => {
            console.log('\\n🎉 Visual workflow test completed!');
        })
        .catch((error) => {
            console.error('💥 Visual workflow test failed:', error);
            process.exit(1);
        });
}

module.exports = { testVisualWorkflow };
