/**
 * ^CourseGeneratorStack
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-13
 * Usage: CDK Stack for deploying Intellilearn Course Generator Step Functions workflow
 * Business Context: Infrastructure as Code for automated course generation system
 * Relations: Step Functions, Lambda, S3, DynamoDB, SNS, Bedrock
 * Reminders: Requires Bedrock model access and proper IAM permissions
 * Security: Follows least privilege principle with specific resource access
 */

import * as cdk from 'aws-cdk-lib';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

interface CourseGeneratorStackProps extends cdk.StackProps {
  readonly environment: 'dev' | 'staging' | 'prod';
  readonly intellilearnAccountId: string;
  readonly existingDynamoTableName?: string;
  readonly existingVectorsBucket?: string;
  readonly existingCoursesBucket?: string;
}

export class CourseGeneratorStack extends cdk.Stack {
  public readonly stateMachine: stepfunctions.StateMachine;
  public readonly visualStateMachine: stepfunctions.StateMachine;
  public readonly completionHandler: lambda.Function;
  public readonly coursesBucket: s3.IBucket;
  public readonly notificationTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: CourseGeneratorStackProps) {
    super(scope, id, props);

    // 📊 Create or reference DynamoDB table
    const courseTable = props.existingDynamoTableName 
      ? dynamodb.Table.fromTableName(this, 'ExistingCourseTable', props.existingDynamoTableName)
      : this.createCourseTable();

    // 🪣 Create or reference S3 buckets for course content and vectors
    this.coursesBucket = props.existingCoursesBucket
      ? s3.Bucket.fromBucketName(this, 'ExistingCoursesBucket', props.existingCoursesBucket)
      : this.createCoursesBucket(props);
    const vectorsBucket = props.existingVectorsBucket
      ? s3.Bucket.fromBucketName(this, 'ExistingVectorsBucket', props.existingVectorsBucket)
      : this.createVectorsBucket(props);

    // 📧 Create SNS topic for notifications
    this.notificationTopic = this.createNotificationTopic(props);

    // 🔧 Create Lambda function for course completion handling
    this.completionHandler = this.createCompletionHandler(courseTable, this.notificationTopic, props);

    // 🎯 Create Step Functions state machine
    this.stateMachine = this.createStateMachine(
      this.coursesBucket,
      vectorsBucket,
      this.completionHandler,
      props
    );

    // 🎨 Create Visual Step Functions state machine with direct Bedrock integration
    this.visualStateMachine = this.createVisualStateMachine(
      this.coursesBucket,
      vectorsBucket,
      this.completionHandler,
      props
    );

    // 📋 Create CloudWatch dashboard
    this.createMonitoringDashboard(props);

    // 🏷️ Add tags
    this.addResourceTags(props);
  }

  private createCourseTable(): dynamodb.Table {
    const table = new dynamodb.Table(this, 'CourseTable', {
      tableName: 'intellilearn-generated-courses',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'type', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Add Global Secondary Indexes
    table.addGlobalSecondaryIndex({
      indexName: 'language-level-index',
      partitionKey: { name: 'language', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'level', type: dynamodb.AttributeType.STRING }
    });

    table.addGlobalSecondaryIndex({
      indexName: 'status-created-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING }
    });

    return table;
  }

  private createCoursesBucket(props: CourseGeneratorStackProps): s3.Bucket {
    return new s3.Bucket(this, 'CoursesBucket', {
      bucketName: `intellilearn-courses-${props.environment}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'course-content-lifecycle',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ]
        }
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });
  }

  private createVectorsBucket(props: CourseGeneratorStackProps): s3.Bucket {
    return new s3.Bucket(this, 'VectorsBucket', {
      bucketName: `intellilearn-vectors-${props.intellilearnAccountId}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });
  }

  private createNotificationTopic(props: CourseGeneratorStackProps): sns.Topic {
    return new sns.Topic(this, 'NotificationTopic', {
      topicName: 'intellilearn-course-notifications',
      displayName: 'Intellilearn Course Generation Notifications',
      fifo: false
    });
  }

  private createCompletionHandler(
    courseTable: dynamodb.ITable,
    notificationTopic: sns.Topic,
    props: CourseGeneratorStackProps
  ): lambda.Function {
    
    const completionHandler = new lambda.Function(this, 'CompletionHandler', {
      functionName: 'intellilearn-course-completion-handler',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'course-completion-handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../src/lambda')),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        COURSE_TABLE_NAME: courseTable.tableName,
        SNS_TOPIC_ARN: notificationTopic.topicArn,
        ENVIRONMENT: props.environment,
        ACCOUNT_ID: props.intellilearnAccountId
      },
      logGroup: new logs.LogGroup(this, 'CompletionHandlerLogGroup', {
        logGroupName: `/aws/lambda/intellilearn-course-completion-handler`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY
      })
    });

    // Grant permissions
    courseTable.grantReadWriteData(completionHandler);
    notificationTopic.grantPublish(completionHandler);
    
    // Grant Bedrock permissions to completion handler
    completionHandler.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream'
      ],
      resources: [
        'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-text-express-v1',
        'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1'
      ]
    }));

    return completionHandler;
  }

  private createStateMachine(
    coursesBucket: s3.IBucket,
    vectorsBucket: s3.IBucket,
    completionHandler: lambda.Function,
    props: CourseGeneratorStackProps
  ): stepfunctions.StateMachine {

    // Create IAM role for Step Functions
    const stepFunctionsRole = new iam.Role(this, 'StepFunctionsRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
      description: 'IAM role for Intellilearn Course Generator Step Functions',
      inlinePolicies: {
        StepFunctionsBasic: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams'
              ],
              resources: ['*']
            })
          ]
        }),
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream'
              ],
              resources: [
                `arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
                `arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1`
              ]
            })
          ]
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:GetObject'
              ],
              resources: [
                `${coursesBucket.bucketArn}/*`,
                `${vectorsBucket.bucketArn}/*`
              ]
            })
          ]
        }),
        LambdaAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['lambda:InvokeFunction'],
              resources: [completionHandler.functionArn]
            })
          ]
        })
      }
    });

    // Load state machine definition
    const stateMachineDefinition = this.loadStateMachineDefinition(
      coursesBucket.bucketName,
      vectorsBucket.bucketName,
      completionHandler.functionName
    );

    // Create Step Functions state machine
    const stateMachine = new stepfunctions.StateMachine(this, 'CourseGeneratorStateMachine', {
      stateMachineName: 'intellilearn-course-generator',
      definitionBody: stepfunctions.DefinitionBody.fromString(JSON.stringify(stateMachineDefinition)),
      role: stepFunctionsRole,
      timeout: cdk.Duration.hours(2),
      logs: {
        destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
          logGroupName: '/aws/stepfunctions/intellilearn-course-generator',
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY
        }),
        level: stepfunctions.LogLevel.ALL,
        includeExecutionData: true
      },
      tracingEnabled: true
    });

    return stateMachine;
  }

  private loadStateMachineDefinition(
    coursesBucketName: string,
    vectorsBucketName: string,
    completionHandlerName: string
  ): any {
    
    // Load the state machine definition and replace placeholders
    const fs = require('fs');
    const definitionPath = path.join(__dirname, '../../src/step-functions/course-generation-state-machine.json');
    let definition = JSON.parse(fs.readFileSync(definitionPath, 'utf8'));

    // Replace bucket names in the definition
    const definitionString = JSON.stringify(definition)
      .replace(/intellilearn-generated-courses-076276934311/g, coursesBucketName)
      .replace(/intellilearn-vectors-076276934311/g, vectorsBucketName)
      .replace(/intellilearn-course-completion-handler/g, completionHandlerName);

    return JSON.parse(definitionString);
  }

  private createVisualStateMachine(
    coursesBucket: s3.IBucket,
    vectorsBucket: s3.IBucket,
    completionHandler: lambda.Function,
    props: CourseGeneratorStackProps
  ): stepfunctions.StateMachine {

    // Create IAM role for Visual Step Functions with Bedrock permissions
    const visualStepFunctionsRole = new iam.Role(this, 'VisualStepFunctionsRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
      description: 'IAM role for Intellilearn Visual Course Generator Step Functions with Bedrock access',
      inlinePolicies: {
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream'
              ],
              resources: [
                'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-text-express-v1',
                'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1'
              ]
            })
          ]
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:PutObjectAcl',
                's3:GetObject'
              ],
              resources: [
                `${coursesBucket.bucketArn}/*`,
                `${vectorsBucket.bucketArn}/*`
              ]
            })
          ]
        }),
        LambdaAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'lambda:InvokeFunction'
              ],
              resources: [
                completionHandler.functionArn
              ]
            })
          ]
        }),
        LogsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // Load visual state machine definition
    const fs = require('fs');
    const visualDefinitionPath = path.join(__dirname, '../../src/step-functions/visual-course-generation-workflow.json');
    const visualDefinition = JSON.parse(fs.readFileSync(visualDefinitionPath, 'utf8'));

    // Create visual state machine
    const visualStateMachine = new stepfunctions.StateMachine(this, 'VisualCourseGeneratorStateMachine', {
      stateMachineName: 'intellilearn-visual-course-generator',
      definitionBody: stepfunctions.DefinitionBody.fromString(JSON.stringify(visualDefinition)),
      role: visualStepFunctionsRole,
      logs: {
        destination: new logs.LogGroup(this, 'VisualStateMachineLogGroup', {
          logGroupName: '/aws/stepfunctions/intellilearn-visual-course-generator',
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY
        }),
        level: stepfunctions.LogLevel.ALL,
        includeExecutionData: true
      },
      tracingEnabled: true
    });

    // Add tags
    cdk.Tags.of(visualStateMachine).add('Project', 'Intellilearn');
    cdk.Tags.of(visualStateMachine).add('Component', 'VisualCourseGenerator');
    cdk.Tags.of(visualStateMachine).add('Environment', props.environment);

    return visualStateMachine;
  }

  private createMonitoringDashboard(props: CourseGeneratorStackProps): void {
    // CloudWatch dashboard will be created here for monitoring
    // This is a placeholder for future implementation
  }

  private addResourceTags(props: CourseGeneratorStackProps): void {
    cdk.Tags.of(this).add('Project', 'Intellilearn');
    cdk.Tags.of(this).add('Component', 'CourseGenerator');
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Owner', 'TelmoAI');
  }
}
