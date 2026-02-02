# GitHub Issues - Quick Start Guide

This guide shows you how to create all 10 GitHub issues for the Mission Control project.

## Prerequisites

- Git repository cloned
- Python 3.6+ installed
- Either:
  - GitHub CLI (`gh`) authenticated, OR
  - GitHub Personal Access Token

## Method 1: API Script (Recommended)

The easiest and most reliable method:

### Step 1: Test (Dry Run)
```bash
cd /path/to/agent-os
./create_issues_api.py --dry-run
```

This shows you all 10 issues that will be created without actually creating them.

### Step 2: Install Requirements
```bash
pip install requests
```

### Step 3: Set GitHub Token

Get a token from https://github.com/settings/tokens with `repo` scope, then:

```bash
export GITHUB_TOKEN='your_token_here'
```

### Step 4: Create Issues
```bash
./create_issues_api.py
```

The script will:
1. Show you the repository and issue count
2. Ask for confirmation
3. Create each issue and show progress
4. Display a summary

## Method 2: GitHub CLI Script

If you prefer using `gh` CLI:

### Step 1: Authenticate
```bash
gh auth login
```

### Step 2: Run Script
```bash
./create_issues.sh
```

## Method 3: Regenerate Script

If you want to modify the issues first:

### Step 1: Edit Issues
```bash
nano create_github_issues.py
# Modify the ISSUES array
```

### Step 2: Regenerate
```bash
python3 create_github_issues.py > create_issues.sh
chmod +x create_issues.sh
```

### Step 3: Run
```bash
./create_issues.sh  # or ./create_issues_api.py
```

## Validation

To test that scripts are working correctly:

```bash
./test_scripts.sh
```

This runs 16 comprehensive tests including:
- Syntax validation
- Permission checks
- Functionality tests
- Content validation

## Issues Created

The script creates 10 issues across 4 phases:

**Phase 0: Foundation (2 issues)**
1. Backend Project Structure Setup with FastAPI
2. Database Schema Design for Agent OS

**Phase 1: Agent SDK Integration (1 issue)**
3. Integrate Claude Agent SDK for Autonomous Operations

**Phase 2: MCP Tool Integration (4 issues)**
4. Set Up Model Context Protocol (MCP) Infrastructure
5. Implement GitHub Operations via MCP
6. Create Secure Code Execution Environment
7. Railway Deployment Integration

**Phase 3: Multi-Agent Orchestration (2 issues)**
8. Integrate CrewAI for Multi-Agent Orchestration
9. Implement Agent Memory System with Vector Database

**Documentation (1 issue)**
10. Create Implementation Guide for Autonomous Agents

## Troubleshooting

### "GitHub CLI not authenticated"
- Solution: Run `gh auth login` or use the API script instead

### "requests module not found"
- Solution: Run `pip install requests`

### "Error: No GitHub token found"
- Solution: Set `GITHUB_TOKEN` environment variable

### Issues not appearing
- Check you're in the right repository: `git remote -v`
- Verify token has `repo` scope
- Check GitHub web UI under Issues tab

## Files

- `create_github_issues.py` - Issue definitions (edit this to modify issues)
- `create_issues.sh` - Generated shell script using `gh` CLI
- `create_issues_api.py` - Python script using GitHub API directly
- `test_scripts.sh` - Validation test suite
- `CREATING_ISSUES.md` - Detailed documentation

## Need Help?

1. Run tests: `./test_scripts.sh`
2. Try dry run: `./create_issues_api.py --dry-run`
3. Check documentation: `CREATING_ISSUES.md`
4. Open a GitHub issue if problems persist
