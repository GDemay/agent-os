#!/bin/bash
# Test script to validate the issue creation scripts

# Don't exit on error - we want to run all tests
set +e

echo "============================================================"
echo "Testing GitHub Issue Creation Scripts"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
tests_passed=0
tests_failed=0

# Helper function
test_step() {
    echo -n "Testing: $1... "
}

test_pass() {
    echo -e "${GREEN}✓ PASS${NC}"
    ((tests_passed++))
}

test_fail() {
    echo -e "${RED}✗ FAIL${NC}"
    echo "  Error: $1"
    ((tests_failed++))
}

echo "1. Testing Python Script Syntax"
echo "--------------------------------"

test_step "create_github_issues.py syntax"
if python3 -m py_compile create_github_issues.py 2>/dev/null; then
    test_pass
else
    test_fail "Python syntax error"
fi

test_step "create_issues_api.py syntax"
if python3 -m py_compile create_issues_api.py 2>/dev/null; then
    test_pass
else
    test_fail "Python syntax error"
fi

echo ""
echo "2. Testing Shell Script Syntax"
echo "-------------------------------"

test_step "create_issues.sh syntax"
if bash -n create_issues.sh 2>/dev/null; then
    test_pass
else
    test_fail "Shell script syntax error"
fi

echo ""
echo "3. Testing Script Permissions"
echo "------------------------------"

test_step "create_issues.sh is executable"
if [ -x create_issues.sh ]; then
    test_pass
else
    test_fail "Script not executable"
fi

test_step "create_issues_api.py is executable"
if [ -x create_issues_api.py ]; then
    test_pass
else
    test_fail "Script not executable"
fi

echo ""
echo "4. Testing Python Script Functionality"
echo "---------------------------------------"

test_step "create_github_issues.py generates output"
if python3 create_github_issues.py | head -5 | grep -q "#!/bin/bash"; then
    test_pass
else
    test_fail "Script doesn't generate expected output"
fi

test_step "Generated script contains gh commands"
if python3 create_github_issues.py | grep -q "gh issue create"; then
    test_pass
else
    test_fail "Generated script missing gh commands"
fi

test_step "Generated script contains correct number of issues"
issue_count=$(python3 create_github_issues.py | grep -c "gh issue create" || echo 0)
if [ "$issue_count" -eq 10 ]; then
    test_pass
else
    test_fail "Expected 10 issues, found $issue_count"
fi

echo ""
echo "5. Testing API Script"
echo "---------------------"

test_step "API script imports successfully"
if python3 -c "from create_github_issues import ISSUES; print(len(ISSUES))" > /dev/null 2>&1; then
    test_pass
else
    test_fail "Cannot import ISSUES from create_github_issues"
fi

test_step "API script has correct number of issues"
issue_count=$(python3 -c "from create_github_issues import ISSUES; print(len(ISSUES))" 2>/dev/null)
if [ "$issue_count" -eq 10 ]; then
    test_pass
else
    test_fail "Expected 10 issues, found $issue_count"
fi

test_step "Dry-run mode works"
if python3 create_issues_api.py --dry-run 2>&1 | grep -q "DRY RUN MODE"; then
    test_pass
else
    test_fail "Dry-run mode not working"
fi

test_step "Dry-run lists all issues"
listed_count=$(python3 create_issues_api.py --dry-run 2>&1 | grep -E "^[0-9]+\. \[" | wc -l)
if [ "$listed_count" -eq 10 ]; then
    test_pass
else
    test_fail "Expected 10 issues listed, found $listed_count"
fi

echo ""
echo "6. Testing Issue Content"
echo "------------------------"

test_step "Issues have required fields"
if python3 -c "from create_github_issues import ISSUES; assert all('title' in i and 'body' in i and 'labels' in i for i in ISSUES)" 2>/dev/null; then
    test_pass
else
    test_fail "Some issues missing required fields"
fi

test_step "All issues have non-empty titles"
if python3 -c "from create_github_issues import ISSUES; assert all(len(i['title']) > 0 for i in ISSUES)" 2>/dev/null; then
    test_pass
else
    test_fail "Some issues have empty titles"
fi

test_step "All issues have non-empty bodies"
if python3 -c "from create_github_issues import ISSUES; assert all(len(i['body']) > 0 for i in ISSUES)" 2>/dev/null; then
    test_pass
else
    test_fail "Some issues have empty bodies"
fi

test_step "All issues have labels"
if python3 -c "from create_github_issues import ISSUES; assert all(len(i['labels']) > 0 for i in ISSUES)" 2>/dev/null; then
    test_pass
else
    test_fail "Some issues have no labels"
fi

echo ""
echo "============================================================"
echo "Test Summary"
echo "============================================================"
echo -e "${GREEN}Passed: $tests_passed${NC}"
if [ $tests_failed -gt 0 ]; then
    echo -e "${RED}Failed: $tests_failed${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
fi
echo ""
echo "The issue creation scripts are ready to use."
echo "Run './create_issues_api.py --dry-run' to preview issues."
echo "============================================================"
