#!/bin/bash

# LUMO Inventory Management System - Choreo Startup Script
# This script handles the production startup for Choreo deployment

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting LUMO Inventory Management System...${NC}"
echo -e "${BLUE}📅 Timestamp: $(date)${NC}"
echo -e "${BLUE}🌍 Environment: ${NODE_ENV:-production}${NC}"
echo -e "${BLUE}🔧 Choreo Environment: ${CHOREO_ENVIRONMENT:-unknown}${NC}"

# Set startup timeout (default 60 seconds, can be overridden by env var)
STARTUP_TIMEOUT=${STARTUP_TIMEOUT:-60}
echo -e "${BLUE}⏱️  Startup timeout set to: ${STARTUP_TIMEOUT} seconds${NC}"

# Function to validate environment variables
validate_env() {
    local var_name=$1
    local var_value=$2
    local is_required=${3:-true}
    
    if [ -z "$var_value" ]; then
        if [ "$is_required" = true ]; then
            echo -e "${RED}❌ ERROR: Required environment variable $var_name is not set${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠️  WARNING: Optional environment variable $var_name is not set${NC}"
            return 0
        fi
    else
        echo -e "${GREEN}✅ $var_name: configured${NC}"
        return 0
    fi
}

# Function to validate Supabase configuration
validate_supabase() {
    echo -e "${BLUE}🔍 Validating Supabase configuration...${NC}"
    
    # Check URL
    if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" || "$NEXT_PUBLIC_SUPABASE_URL" == *"your-project-url"* || "$NEXT_PUBLIC_SUPABASE_URL" == *"placeholder"* ]]; then
        echo -e "${RED}❌ SUPABASE_URL is missing or contains placeholder value${NC}"
        return 1
    fi
    
    # Check Key
    if [[ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" || "$NEXT_PUBLIC_SUPABASE_ANON_KEY" == *"your-anon-key"* || "$NEXT_PUBLIC_SUPABASE_ANON_KEY" == *"placeholder"* ]]; then
        echo -e "${RED}❌ SUPABASE_ANON_KEY is missing or contains placeholder value${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Supabase configuration is valid${NC}"
    return 0
}

# Function to validate JWT secret
validate_jwt() {
    echo -e "${BLUE}🔐 Validating JWT configuration...${NC}"
    
    if [ -z "$JWT_SECRET" ]; then
        echo -e "${RED}❌ JWT_SECRET is not set${NC}"
        return 1
    fi
    
    # Check JWT secret length (should be at least 32 characters)
    if [ ${#JWT_SECRET} -lt 32 ]; then
        echo -e "${RED}❌ JWT_SECRET is too short (minimum 32 characters required)${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ JWT_SECRET: valid (${#JWT_SECRET} characters)${NC}"
    return 0
}

echo -e "${BLUE}📋 Environment Validation Starting...${NC}"

# Validate required environment variables
validate_env "NODE_ENV" "$NODE_ENV" true || exit 1
validate_env "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" true || exit 1
validate_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" true || exit 1
validate_env "JWT_SECRET" "$JWT_SECRET" true || exit 1

# Validate optional environment variables
validate_env "DATABASE_URL" "$DATABASE_URL" false
validate_env "NEXTAUTH_URL" "$NEXTAUTH_URL" false
validate_env "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET" false

# Validate Supabase configuration
validate_supabase || exit 1

# Validate JWT secret
validate_jwt || exit 1

echo -e "${GREEN}✅ All environment variables validated successfully${NC}"

# Set production optimizations
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"

# Add startup performance optimizations
export UV_THREADPOOL_SIZE=16
export MALLOC_ARENA_MAX=2

echo -e "${BLUE}🔧 Production optimizations applied${NC}"

# Verify Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed or not in PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check if the application file exists
if [ ! -f "lumo-static-server.js" ]; then
    echo -e "${RED}❌ lumo-static-server.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Application file found${NC}"

# Create a function to start the application with timeout
start_with_timeout() {
    echo -e "${BLUE}🚀 Starting LUMO application with timeout protection...${NC}"
    
    # Start the application in the background
    timeout ${STARTUP_TIMEOUT}s node lumo-static-server.js &
    APP_PID=$!
    
    # Wait for the process
    if wait $APP_PID; then
        echo -e "${GREEN}✅ Application started successfully${NC}"
        return 0
    else
        EXIT_CODE=$?
        if [ $EXIT_CODE -eq 124 ]; then
            echo -e "${RED}❌ Application startup timed out after ${STARTUP_TIMEOUT} seconds${NC}"
        else
            echo -e "${RED}❌ Application failed with exit code: $EXIT_CODE${NC}"
        fi
        return $EXIT_CODE
    fi
}

# Pre-startup health check
echo -e "${BLUE}🏥 Pre-startup health check...${NC}"
echo -e "${GREEN}✅ System ready for startup${NC}"

# Start the application
echo -e "${BLUE}🎯 Initiating LUMO startup sequence...${NC}"

# Use timeout protection
if start_with_timeout; then
    echo -e "${GREEN}🎉 LUMO started successfully!${NC}"
    exit 0
else
    echo -e "${RED}💥 LUMO startup failed${NC}"
    exit 1
fi 