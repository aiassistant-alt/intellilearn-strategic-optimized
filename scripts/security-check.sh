#!/bin/bash

echo "🔐 Security Check Script"
echo "======================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for exposed credentials in code
echo "1. Checking for exposed AWS credentials in code..."
if grep -r "AKIA[A-Z0-9]\{16\}" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.env*" 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: AWS Access Keys found in code!${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No AWS Access Keys found in code${NC}"
fi

# Check .gitignore
echo ""
echo "2. Checking .gitignore configuration..."
if grep -q "\.env\.aws" .gitignore && grep -q "\.env\.local" .gitignore; then
    echo -e "${GREEN}✅ Environment files are properly gitignored${NC}"
else
    echo -e "${RED}❌ WARNING: Environment files not in .gitignore!${NC}"
fi

# Check file permissions
echo ""
echo "3. Checking file permissions..."
if [ -f ".env.aws" ]; then
    perms=$(stat -c "%a" .env.aws 2>/dev/null || stat -f "%Lp" .env.aws 2>/dev/null)
    if [ "$perms" = "600" ] || [ "$perms" = "400" ]; then
        echo -e "${GREEN}✅ .env.aws has secure permissions${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.aws should have 600 permissions (chmod 600 .env.aws)${NC}"
    fi
fi

# Check for credentials in environment variables
echo ""
echo "4. Checking environment variables in .env.local..."
if [ -f ".env.local" ]; then
    if grep -q "^AWS_ACCESS_KEY_ID=" .env.local || grep -q "^AWS_SECRET_ACCESS_KEY=" .env.local; then
        echo -e "${RED}❌ CRITICAL: AWS credentials found in .env.local!${NC}"
        echo "   Move them to .env.aws instead"
    else
        echo -e "${GREEN}✅ No AWS credentials in .env.local${NC}"
    fi
fi

# Check for NEXT_PUBLIC AWS credentials
echo ""
echo "5. Checking for frontend-exposed credentials..."
if grep -q "^NEXT_PUBLIC_AWS.*KEY" .env.local 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: AWS credentials exposed to frontend!${NC}"
    echo "   Remove any NEXT_PUBLIC_AWS_ACCESS_KEY_ID or NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY"
else
    echo -e "${GREEN}✅ No AWS credentials exposed to frontend${NC}"
fi

# Check build output
echo ""
echo "6. Checking build output..."
if [ -d "out" ]; then
    if grep -r "AKIA[A-Z0-9]\{16\}" out/ 2>/dev/null; then
        echo -e "${RED}❌ CRITICAL: AWS credentials found in build output!${NC}"
        echo "   Rebuild the application after removing credentials"
    else
        echo -e "${GREEN}✅ Build output is clean${NC}"
    fi
fi

echo ""
echo "========================"
echo "Security Check Complete"
echo "========================"

# Final recommendations
echo ""
echo "📋 Security Recommendations:"
echo "1. Rotate the exposed AWS credentials immediately"
echo "2. Enable MFA on your AWS account"
echo "3. Use IAM roles instead of access keys when possible"
echo "4. Regularly audit your AWS permissions"
echo "5. Never commit .env files to version control"