#!/usr/bin/env node

/**
 * ^TestCourseGeneration
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-01-13
 * Usage: Test script to generate language courses using Step Functions
 * Business Context: Validates the course generation workflow
 * Relations: Step Functions, Lambda, Bedrock, S3
 * Reminders: Requires AWS credentials and deployed infrastructure
 */

const { SFNClient, StartExecutionCommand, DescribeExecutionCommand } = require('@aws-sdk/client-sfn');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Configuration
const REGION = 'us-east-1';
const STATE_MACHINE_ARN = 'arn:aws:states:us-east-1:076276934311:stateMachine:CourseGeneratorStateMachine';

// Initialize AWS clients
const sfnClient = new SFNClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

/**
 * Test course generation for different languages and levels
 */
async function testCourseGeneration() {
    console.log('🎓 Starting Intellilearn Course Generator Tests');
    console.log('=' .repeat(60));

    // Test cases
    const testCases = [
        {
            name: 'English A1 Course',
            input: {
                language: 'English',
                level: 'A1',
                courseType: 'General',
                duration: 8
            }
        },
        {
            name: 'French B1 Course',
            input: {
                language: 'French',
                level: 'B1',
                courseType: 'Business',
                duration: 12
            }
        },
        {
            name: 'Spanish A2 Course',
            input: {
                language: 'Spanish',
                level: 'A2',
                courseType: 'Conversational',
                duration: 10
            }
        }
    ];

    for (const testCase of testCases) {
        console.log(`\\n🚀 Testing: ${testCase.name}`);
        console.log('-'.repeat(40));
        
        try {
            // Start execution
            const executionArn = await startExecution(testCase.input, testCase.name);
            console.log(`✅ Execution started: ${executionArn}`);
            
            // Monitor execution
            const result = await monitorExecution(executionArn);
            
            if (result.status === 'SUCCEEDED') {
                console.log(`🎉 ${testCase.name} completed successfully!`);
                
                // Parse and display results
                const output = JSON.parse(result.output);
                console.log(`📍 Course ID: ${output.courseId}`);
                console.log(`📍 S3 Location: ${output.s3Location}`);
                
                // Optionally download and preview content
                if (process.argv.includes('--preview')) {
                    await previewCourseContent(output.s3Location);
                }
                
            } else {
                console.log(`❌ ${testCase.name} failed: ${result.status}`);
                if (result.error) {
                    console.log(`Error: ${result.error}`);
                }
            }
            
        } catch (error) {
            console.error(`💥 Error testing ${testCase.name}:`, error.message);
        }
        
        // Wait between tests
        if (testCase !== testCases[testCases.length - 1]) {
            console.log('⏳ Waiting 30 seconds before next test...');
            await sleep(30000);
        }
    }
    
    console.log('\\n🏁 All tests completed!');
}

/**
 * Start Step Functions execution
 */
async function startExecution(input, name) {
    const executionName = `test-${name.toLowerCase().replace(/\\s+/g, '-')}-${Date.now()}`;
    
    const command = new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        name: executionName,
        input: JSON.stringify(input)
    });
    
    const response = await sfnClient.send(command);
    return response.executionArn;
}

/**
 * Monitor execution until completion
 */
async function monitorExecution(executionArn) {
    console.log('⏳ Monitoring execution...');
    
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 60; // 30 minutes max
    
    while (status === 'RUNNING' && attempts < maxAttempts) {
        await sleep(30000); // Wait 30 seconds
        attempts++;
        
        const command = new DescribeExecutionCommand({
            executionArn: executionArn
        });
        
        const response = await sfnClient.send(command);
        status = response.status;
        
        console.log(`📊 Status: ${status} (${attempts}/${maxAttempts})`);
        
        if (status === 'SUCCEEDED') {
            return {
                status: status,
                output: response.output
            };
        } else if (status === 'FAILED' || status === 'TIMED_OUT' || status === 'ABORTED') {
            return {
                status: status,
                error: response.error || 'Unknown error'
            };
        }
    }
    
    if (attempts >= maxAttempts) {
        return {
            status: 'TIMEOUT',
            error: 'Execution monitoring timed out'
        };
    }
}

/**
 * Preview generated course content from S3
 */
async function previewCourseContent(s3Key) {
    try {
        console.log('\\n📖 Previewing course content...');
        
        const command = new GetObjectCommand({
            Bucket: 'intellilearn-courses-dev',
            Key: s3Key
        });
        
        const response = await s3Client.send(command);
        const content = await response.Body.transformToString();
        const courseData = JSON.parse(content);
        
        console.log('\\n📚 Course Structure:');
        console.log(`Language: ${courseData.language}`);
        console.log(`Level: ${courseData.level}`);
        console.log(`Type: ${courseData.courseType}`);
        console.log(`Duration: ${courseData.duration} weeks`);
        
        if (courseData.outline && courseData.outline.content) {
            console.log('\\n📋 Outline Preview:');
            console.log(courseData.outline.content.substring(0, 200) + '...');
        }
        
        if (courseData.curriculum && courseData.curriculum.content) {
            console.log('\\n📖 Curriculum Preview:');
            console.log(courseData.curriculum.content.substring(0, 200) + '...');
        }
        
    } catch (error) {
        console.error('❌ Error previewing content:', error.message);
    }
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Display usage information
 */
function showUsage() {
    console.log(`
🎓 Intellilearn Course Generator Test Script

Usage:
  node test-course-generation.js [options]

Options:
  --preview     Download and preview generated course content
  --help        Show this help message

Examples:
  node test-course-generation.js
  node test-course-generation.js --preview

This script will test course generation for:
- English A1 (General, 8 weeks)
- French B1 (Business, 12 weeks)  
- Spanish A2 (Conversational, 10 weeks)

Each test takes approximately 5-10 minutes to complete.
    `);
}

// Main execution
if (require.main === module) {
    if (process.argv.includes('--help')) {
        showUsage();
        process.exit(0);
    }
    
    testCourseGeneration()
        .then(() => {
            console.log('\\n✨ Test script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test script failed:', error);
            process.exit(1);
        });
}

module.exports = {
    testCourseGeneration,
    startExecution,
    monitorExecution
};
