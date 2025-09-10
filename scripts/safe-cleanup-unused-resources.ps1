# Safe Cleanup Script for Unused AWS Resources
# This script safely removes unused resources after confirmation

param(
    [string]$Region = "us-east-1",
    [switch]$Force = $false
)

Write-Host "🧹 AWS Resource Cleanup for IntelliLearn" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host ""

# Set AWS credentials from environment
# These should be set in your environment before running this script
$env:AWS_DEFAULT_REGION = $Region

# Resources to delete (confirmed unused)
$UNUSED_RESOURCES = @{
    DynamoDBTables = @(
        "ContabilIA_Data",     # From another project
        "MatterMind_Data"      # From another project
    )
    S3Buckets = @(
        "cogniaintellilearncontent"  # Duplicate bucket, use cognia-intellilearn instead
    )
}

# Function to confirm deletion
function Confirm-Deletion {
    param([string]$ResourceType, [string]$ResourceName)
    
    if ($Force) {
        return $true
    }
    
    $response = Read-Host "Delete $ResourceType '$ResourceName'? (yes/no)"
    return $response -eq "yes"
}

# Delete unused DynamoDB tables
function Remove-UnusedDynamoDBTables {
    Write-Host "🗑️ Removing Unused DynamoDB Tables..." -ForegroundColor Yellow
    
    foreach ($table in $UNUSED_RESOURCES.DynamoDBTables) {
        try {
            # Check if table exists
            $tableExists = aws dynamodb describe-table --table-name $table --region $Region 2>$null
            
            if ($tableExists) {
                Write-Host "Found table: $table" -ForegroundColor White
                
                if (Confirm-Deletion "DynamoDB Table" $table) {
                    Write-Host "  Deleting $table..." -ForegroundColor Yellow
                    aws dynamodb delete-table --table-name $table --region $Region --output json | Out-Null
                    Write-Host "  ✅ Deleted $table" -ForegroundColor Green
                }
                else {
                    Write-Host "  ⏭️ Skipped $table" -ForegroundColor Gray
                }
            }
            else {
                Write-Host "  ℹ️ Table $table not found (already deleted?)" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  ❌ Error with table $table: $_" -ForegroundColor Red
        }
    }
}

# Delete unused S3 buckets
function Remove-UnusedS3Buckets {
    Write-Host ""
    Write-Host "🗑️ Removing Unused S3 Buckets..." -ForegroundColor Yellow
    
    foreach ($bucket in $UNUSED_RESOURCES.S3Buckets) {
        try {
            # Check if bucket exists
            $bucketExists = aws s3api head-bucket --bucket $bucket 2>$null
            $exitCode = $LASTEXITCODE
            
            if ($exitCode -eq 0) {
                Write-Host "Found bucket: $bucket" -ForegroundColor White
                
                # Check if bucket is empty
                $objectCount = (aws s3 ls s3://$bucket --recursive 2>$null | Measure-Object).Count
                Write-Host "  Objects in bucket: $objectCount" -ForegroundColor Gray
                
                if (Confirm-Deletion "S3 Bucket" $bucket) {
                    if ($objectCount -gt 0) {
                        Write-Host "  ⚠️ Bucket contains objects. Delete all objects first? (yes/no)" -ForegroundColor Yellow
                        $deleteObjects = Read-Host
                        
                        if ($deleteObjects -eq "yes") {
                            Write-Host "  Deleting all objects..." -ForegroundColor Yellow
                            aws s3 rm s3://$bucket --recursive
                        }
                        else {
                            Write-Host "  ⏭️ Skipped $bucket (contains objects)" -ForegroundColor Gray
                            continue
                        }
                    }
                    
                    Write-Host "  Deleting bucket $bucket..." -ForegroundColor Yellow
                    aws s3 rb s3://$bucket
                    Write-Host "  ✅ Deleted $bucket" -ForegroundColor Green
                }
                else {
                    Write-Host "  ⏭️ Skipped $bucket" -ForegroundColor Gray
                }
            }
            else {
                Write-Host "  ℹ️ Bucket $bucket not found (already deleted?)" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  ❌ Error with bucket $bucket: $_" -ForegroundColor Red
        }
    }
}

# Clean up empty CloudWatch Log Groups
function Remove-EmptyLogGroups {
    Write-Host ""
    Write-Host "🗑️ Removing Empty CloudWatch Log Groups..." -ForegroundColor Yellow
    
    try {
        $logGroups = aws logs describe-log-groups --region $Region --output json | ConvertFrom-Json
        $emptyGroups = $logGroups.logGroups | Where-Object { $_.storedBytes -eq 0 }
        
        if ($emptyGroups.Count -eq 0) {
            Write-Host "  No empty log groups found" -ForegroundColor Gray
            return
        }
        
        foreach ($logGroup in $emptyGroups) {
            $name = $logGroup.logGroupName
            
            # Skip if it's related to our active Lambda
            if ($name -match "cognia-integration-aws-voice-streaming") {
                continue
            }
            
            Write-Host "Found empty log group: $name" -ForegroundColor White
            
            if (Confirm-Deletion "CloudWatch Log Group" $name) {
                Write-Host "  Deleting $name..." -ForegroundColor Yellow
                aws logs delete-log-group --log-group-name $name --region $Region
                Write-Host "  ✅ Deleted $name" -ForegroundColor Green
            }
            else {
                Write-Host "  ⏭️ Skipped $name" -ForegroundColor Gray
            }
        }
    }
    catch {
        Write-Host "  ❌ Error cleaning log groups: $_" -ForegroundColor Red
    }
}

# Main execution
Write-Host "⚠️  WARNING: This script will DELETE AWS resources!" -ForegroundColor Red
Write-Host "Make sure you have reviewed the resources to be deleted." -ForegroundColor Yellow
Write-Host ""

if (-not $Force) {
    $continue = Read-Host "Continue with cleanup? (yes/no)"
    if ($continue -ne "yes") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

# Execute cleanup
Remove-UnusedDynamoDBTables
Remove-UnusedS3Buckets
Remove-EmptyLogGroups

Write-Host ""
Write-Host "==================" -ForegroundColor Cyan
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Summary of protected resources (NOT deleted):" -ForegroundColor Cyan
Write-Host "  - DynamoDB: intellilearn_Data" -ForegroundColor White
Write-Host "  - S3: integration-aws-app-076276934311 (website hosting)" -ForegroundColor White
Write-Host "  - S3: cognia-intellilearn (content storage)" -ForegroundColor White
Write-Host "  - Lambda: cognia-integration-aws-voice-streaming" -ForegroundColor White
Write-Host "  - CloudFront: E1UF9C891JJD1F" -ForegroundColor White
Write-Host "  - Cognito: us-east-1_ZRhTo5zvG" -ForegroundColor White