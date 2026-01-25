#!/bin/bash

# AI Optimization Validation Script
# Tests all optimized features to ensure they work correctly

echo "🚀 AI Optimization Validation Script"
echo "===================================="
echo ""

BASE_URL="http://localhost:5000"
SESSION_ID=$(uuidgen)

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to test API
test_api() {
    local test_name=$1
    local endpoint=$2
    local data=$3
    local expected_field=$4
    
    echo -n "Testing: $test_name... "
    
    response=$(curl -s -X POST "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data")
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Response: $response"
        ((FAILED++))
        return 1
    fi
}

# Test 1: Health Check
echo "📋 Test 1: Server Health Check"
if curl -s "$BASE_URL/health" | grep -q "ok"; then
    echo -e "${GREEN}✓ Server is running${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Server is not responding${NC}"
    echo "  Please start the server: npm start"
    exit 1
fi
echo ""

# Test 2: Basic Chat (Cache MISS)
echo "📋 Test 2: Basic Chat Query (Cache MISS)"
test_api "Basic query" "/api/ai/chat" \
    '{"question": "tìm quán phở ngon gần hồ hoàn kiếm"}' \
    "success"
echo ""

# Test 3: Cache Hit
echo "📋 Test 3: Same Query (Cache HIT)"
sleep 1
test_api "Cache hit" "/api/ai/chat" \
    '{"question": "tìm quán phở ngon gần hồ hoàn kiếm"}' \
    "success"
echo "  Expected: Should see cache HIT in server logs"
echo ""

# Test 4: Personalization
echo "📋 Test 4: Personalized Query (Vegetarian)"
test_api "Vegetarian preference" "/api/ai/chat" \
    '{
        "question": "tìm quán ăn",
        "preferences": {
            "dietary": ["vegetarian"],
            "atmosphere": ["quiet"]
        },
        "usePersonalization": true
    }' \
    "success"
echo "  Expected: Should boost vegetarian places in rankings"
echo ""

# Test 5: Multi-turn - Initial Query
echo "📋 Test 5: Multi-turn Conversation - Start Session"
test_api "Start conversation" "/api/ai/chat" \
    "{
        \"question\": \"tìm quán cafe yên tĩnh để làm việc\",
        \"sessionId\": \"$SESSION_ID\",
        \"userId\": \"test-user-001\"
    }" \
    "success"
echo ""

# Test 6: Multi-turn - Reference
echo "📋 Test 6: Multi-turn - Reference to First Place"
sleep 1
test_api "Reference query" "/api/ai/chat" \
    "{
        \"question\": \"quán đầu tiên có mở cửa không?\",
        \"sessionId\": \"$SESSION_ID\"
    }" \
    "success"
echo "  Expected: Direct answer without new search"
echo ""

# Test 7: Multi-turn - Follow-up
echo "📋 Test 7: Multi-turn - Follow-up Question"
sleep 1
test_api "Follow-up query" "/api/ai/chat" \
    "{
        \"question\": \"giá bao nhiêu?\",
        \"sessionId\": \"$SESSION_ID\"
    }" \
    "success"
echo "  Expected: Price info about the same place"
echo ""

# Test 8: Time Context
echo "📋 Test 8: Time-of-Day Context"
current_hour=$(date +%H)
echo "  Current hour: $current_hour"
test_api "Time context" "/api/ai/chat" \
    '{"question": "tìm quán ăn ngon"}' \
    "success"

if [ $current_hour -ge 6 ] && [ $current_hour -lt 10 ]; then
    echo "  Expected: Breakfast suggestions"
elif [ $current_hour -ge 11 ] && [ $current_hour -lt 14 ]; then
    echo "  Expected: Lunch suggestions"
elif [ $current_hour -ge 17 ] && [ $current_hour -lt 21 ]; then
    echo "  Expected: Dinner suggestions"
else
    echo "  Expected: General suggestions"
fi
echo ""

# Test 9: Cache Statistics
echo "📋 Test 9: Cache Statistics Endpoint"
stats=$(curl -s "$BASE_URL/api/ai/stats")
if echo "$stats" | grep -q "hitRate"; then
    echo -e "${GREEN}✓ Cache stats available${NC}"
    echo "$stats" | python3 -m json.tool 2>/dev/null || echo "$stats"
    ((PASSED++))
else
    echo -e "${RED}✗ Cache stats not available${NC}"
    ((FAILED++))
fi
echo ""

# Test 10: Pre-filter Optimization
echo "📋 Test 10: Pre-filter with District"
test_api "District filter" "/api/ai/chat" \
    '{
        "question": "tìm quán cafe tại Ba Đình",
        "filters": {
            "district": "Ba Đình"
        }
    }' \
    "success"
echo "  Expected: Only Ba Dinh district results"
echo ""

# Summary
echo "===================================="
echo "📊 Test Results Summary"
echo "===================================="
echo -e "Total tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! AI optimization is working correctly.${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed. Please check the logs for details.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check server logs: tail -f logs/ai-combined.log"
    echo "2. Verify environment variables are set"
    echo "3. Ensure MongoDB and Pinecone are accessible"
    echo "4. Review AI_DEPLOYMENT_GUIDE.md for common issues"
    exit 1
fi
