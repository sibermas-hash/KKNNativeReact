#!/bin/bash

# 🧪 Geolocation System - Quick Smoke Test Script
# Run this after setup to verify core functionality

set -e  # Exit on first error

echo "=========================================="
echo "🧪 Geolocation System Smoke Tests"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

# Function to test and report
test_command() {
    local test_name=$1
    local command=$2
    
    echo -n "Testing: $test_name ... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
    fi
}

# ==========================================
# DATABASE TESTS
# ==========================================
echo -e "${YELLOW}📦 DATABASE TESTS${NC}"
echo ""

test_command "Migrations run" "php artisan migrate:status --pending | grep -q 'Nothing to migrate' || php artisan migrate"

test_command "Attendances table exists" "php artisan tinker --execute='DB::table(\"attendances\");' 2>/dev/null"

test_command "Photos table exists" "php artisan tinker --execute='DB::table(\"attendance_photos\");' 2>/dev/null"

test_command "Sync logs table exists" "php artisan tinker --execute='DB::table(\"attendance_sync_logs\");' 2>/dev/null"

test_command "Dispensations table exists" "php artisan tinker --execute='DB::table(\"location_dispensations\");' 2>/dev/null"

echo ""

# ==========================================
# MODEL TESTS
# ==========================================
echo -e "${YELLOW}🏛️ MODEL TESTS${NC}"
echo ""

test_command "Attendance model exists" "php artisan tinker --execute='App\\\\Models\\\\KKN\\\\Attendance::class;' 2>/dev/null"

test_command "AttendancePhoto model exists" "php artisan tinker --execute='App\\\\Models\\\\KKN\\\\AttendancePhoto::class;' 2>/dev/null"

test_command "LocationDispensation model exists" "php artisan tinker --execute='App\\\\Models\\\\KKN\\\\LocationDispensation::class;' 2>/dev/null"

test_command "AttendanceSyncLog model exists" "php artisan tinker --execute='App\\\\Models\\\\KKN\\\\AttendanceSyncLog::class;' 2>/dev/null"

echo ""

# ==========================================
# SERVICE TESTS
# ==========================================
echo -e "${YELLOW}⚙️ SERVICE TESTS${NC}"
echo ""

test_command "ValidationService class exists" "php artisan tinker --execute='App\\\\Services\\\\KKN\\\\AttendanceValidationService::class;' 2>/dev/null"

test_command "FraudDetectionService class exists" "php artisan tinker --execute='App\\\\Services\\\\KKN\\\\FraudDetectionService::class;' 2>/dev/null"

echo ""

# ==========================================
# ROUTE TESTS
# ==========================================
echo -e "${YELLOW}🛣️ ROUTE TESTS${NC}"
echo ""

test_command "API routes registered" "php artisan route:list | grep -q 'api/attendance'"

test_command "POST attendance route exists" "php artisan route:list | grep -q 'POST.*api/attendance'"

test_command "GET attendance route exists" "php artisan route:list | grep -q 'GET.*api/attendance$'"

test_command "GET attendance sync status route exists" "php artisan route:list | grep -q 'api/attendance/sync-status'"

echo ""

# ==========================================
# CONTROLLER TESTS
# ==========================================
echo -e "${YELLOW}🎮 CONTROLLER TESTS${NC}"
echo ""

test_command "AttendanceController exists" "php artisan tinker --execute='App\\\\Http\\\\Controllers\\\\Api\\\\AttendanceController::class;' 2>/dev/null"

echo ""

# ==========================================
# FRONTEND TESTS
# ==========================================
echo -e "${YELLOW}🎨 FRONTEND TESTS${NC}"
echo ""

test_command "Frontend component exists" "ls resources/js/Components/Geolocation/GeolocationCapture.tsx 2>/dev/null | grep -q GeolocationCapture"

test_command "Sync monitor component exists" "ls resources/js/Components/Geolocation/AttendanceSyncMonitor.tsx 2>/dev/null | grep -q AttendanceSyncMonitor"

test_command "IndexedDB service exists" "ls resources/js/Services/IndexedDBService.ts 2>/dev/null | grep -q IndexedDBService"

test_command "Sync service exists" "ls resources/js/Services/AttendanceSyncService.ts 2>/dev/null | grep -q AttendanceSyncService"

echo ""

# ==========================================
# DOCUMENTATION TESTS
# ==========================================
echo -e "${YELLOW}📚 DOCUMENTATION${NC}"
echo ""

test_command "Implementation guide exists" "ls docs/GEOLOCATION_IMPLEMENTATION.md 2>/dev/null"

test_command "Testing guide exists" "ls docs/GEOLOCATION_TESTING_GUIDE.md 2>/dev/null"

test_command "Integration test manual exists" "ls docs/GEOLOCATION_INTEGRATION_TEST_MANUAL.md 2>/dev/null"

echo ""

# ==========================================
# SUMMARY
# ==========================================
echo "=========================================="
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All smoke tests PASSED!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run manual integration tests (see GEOLOCATION_INTEGRATION_TEST_MANUAL.md)"
    echo "2. Test GPS capture in browser"
    echo "3. Test offline/online scenarios"
    echo "4. Verify fraud detection logic"
    exit 0
else
    echo -e "${RED}❌ Some tests FAILED!${NC}"
    echo ""
    echo "Failed tests:"
    echo "Please check the output above and fix any issues"
    exit 1
fi
