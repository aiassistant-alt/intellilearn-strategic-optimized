#!/usr/bin/env node

/**
 * ^CourseGeneratorApp
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-13
 * Usage: CDK App entry point for Intellilearn Course Generator infrastructure
 * Business Context: Deploys course generation infrastructure across environments
 * Relations: CourseGeneratorStack, AWS CDK
 * Reminders: Configure environment-specific parameters before deployment
 * Security: Uses existing Intellilearn AWS account and resources
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CourseGeneratorStack } from './course-generator-stack';

const app = new cdk.App();

// 🏗️ Configuration for different environments
const environments = {
  dev: {
    account: '076276934311', // Intellilearn AWS Account
    region: 'us-east-1'
  },
  staging: {
    account: '076276934311',
    region: 'us-east-1'
  },
  prod: {
    account: '076276934311', 
    region: 'us-east-1'
  }
};

// 📋 Get environment from context or default to dev
const environmentName = app.node.tryGetContext('environment') || 'dev';
const environment = environments[environmentName as keyof typeof environments];

if (!environment) {
  throw new Error(`Unknown environment: ${environmentName}. Valid environments: ${Object.keys(environments).join(', ')}`);
}

// 🚀 Deploy Course Generator Stack
new CourseGeneratorStack(app, `IntellilearnCourseGenerator-${environmentName}`, {
  env: environment,
  environment: environmentName as 'dev' | 'staging' | 'prod',
  intellilearnAccountId: environment.account,
  
  // 🔗 Use existing Intellilearn resources for all environments
  existingDynamoTableName: 'intellilearn-data-prod',
  existingVectorsBucket: 'intellilearn-vectors-076276934311',
  existingCoursesBucket: 'intellilearn-courses-dev',
  
  // 🏷️ Stack tags
  tags: {
    Project: 'Intellilearn',
    Component: 'CourseGenerator',
    Environment: environmentName,
    ManagedBy: 'CDK',
    Owner: 'TelmoAI',
    CostCenter: 'Education-Platform',
    CreatedBy: 'Luis-Arturo-Parra'
  },
  
  // 📝 Stack description
  description: `Intellilearn Course Generator infrastructure for ${environmentName} environment - Automated language course generation using Step Functions, Bedrock, and Lambda`
});

// 📊 Add metadata - moved before stack creation
// app.node.setContext('@aws-cdk/core:enableStackNameDuplicates', false);
// app.node.setContext('@aws-cdk/core:stackRelativeExports', true);
