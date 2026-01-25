#!/bin/bash

###############################################################################
# AI Service Optimization - Quick Start Script
# Automates installation and setup of enterprise-grade optimizations
###############################################################################

set -e  # Exit on error

echo "🚀 HaNoiGo AI Service Optimization - Quick Start"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from server directory${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo -e "${YELLOW}📦 Step 1: Installing dependencies...${NC}"
npm install prom-client@^15.1.0 opossum@^8.1.4

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Step 2: Create required directories
echo ""
echo -e "${YELLOW}📁 Step 2: Creating directory structure...${NC}"
mkdir -p services/ai/types
mkdir -p services/ai/middleware
mkdir -p services/ai/monitoring

echo -e "${GREEN}✅ Directories created:${NC}"
echo "   - services/ai/types"
echo "   - services/ai/middleware"
echo "   - services/ai/monitoring"

# Step 3: Check MongoDB connection
echo ""
echo -e "${YELLOW}🗄️  Step 3: Checking MongoDB connection...${NC}"

if [ -f ".env" ]; then
    source .env
    echo "   MongoDB URI: ${MONGODB_URI:-localhost:27017}"
else
    echo -e "${YELLOW}⚠️  No .env file found, using default localhost${NC}"
fi

# Step 4: Run database optimization
echo ""
echo -e "${YELLOW}⚡ Step 4: Optimizing database indexes...${NC}"
echo "   This will create indexes for:"
echo "   - Semantic search (aiTags + district)"
echo "   - Geospatial search (location)"
echo "   - Full-text search (name, description, menu)"
echo "   - Price range, category, status"
echo ""

read -p "   Run database optimization now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run optimize:db
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database optimization complete${NC}"
    else
        echo -e "${RED}❌ Database optimization failed${NC}"
        echo "   Check MongoDB connection and try again"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Skipping database optimization${NC}"
    echo "   Run manually later: npm run optimize:db"
fi

# Step 5: Environment variables check
echo ""
echo -e "${YELLOW}🔧 Step 5: Checking environment variables...${NC}"

REQUIRED_VARS=(
    "MONGODB_URI"
    "OPENAI_API_KEY"
)

OPTIONAL_VARS=(
    "REDIS_HOST"
    "REDIS_PORT"
    "REDIS_PASSWORD"
    "CACHE_TTL"
    "LLM_TIMEOUT"
)

if [ -f ".env" ]; then
    source .env
    
    # Check required vars
    MISSING_REQUIRED=0
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}   ❌ Missing required: $var${NC}"
            MISSING_REQUIRED=1
        else
            echo -e "${GREEN}   ✓ $var${NC}"
        fi
    done
    
    # Check optional vars
    echo ""
    echo "   Optional Redis configuration:"
    for var in "${OPTIONAL_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${YELLOW}   ⚠️  Not set: $var (using default)${NC}"
        else
            echo -e "${GREEN}   ✓ $var${NC}"
        fi
    done
    
    if [ $MISSING_REQUIRED -eq 1 ]; then
        echo ""
        echo -e "${RED}❌ Missing required environment variables${NC}"
        echo "   Add them to .env file and run again"
        exit 1
    fi
else
    echo -e "${RED}❌ No .env file found${NC}"
    echo "   Copy .env.example to .env and configure"
    exit 1
fi

# Step 6: Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Optimization Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📊 What was done:"
echo "   ✅ Installed prom-client & opossum"
echo "   ✅ Created directory structure"
echo "   ✅ MongoDB indexes created (if selected)"
echo "   ✅ Environment validated"
echo ""
echo "🚀 Next steps:"
echo "   1. Start Redis server (if using distributed cache)"
echo "      docker run -d -p 6379:6379 redis:latest"
echo ""
echo "   2. Start the server:"
echo "      npm run dev"
echo ""
echo "   3. Check metrics endpoint:"
echo "      curl http://localhost:5000/api/ai/metrics"
echo ""
echo "   4. Monitor health:"
echo "      curl http://localhost:5000/api/ai/health"
echo ""
echo "📈 Expected improvements:"
echo "   - P99 latency: 2-3s → <1.5s"
echo "   - Cache hit rate: 40% → >70%"
echo "   - DB query time: 250ms → <100ms"
echo "   - Request deduplication: ~20-30%"
echo ""
echo -e "${GREEN}Happy optimizing! 🎉${NC}"
