#!/usr/bin/env python3
"""
Script to create GitHub issues using GitHub API directly
This provides an alternative to the gh CLI for environments where gh auth is not available
"""

import os
import sys
import json
import subprocess
from typing import List, Dict

def get_github_token() -> str:
    """Get GitHub token from environment or prompt user"""
    token = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
    if not token:
        print("Error: No GitHub token found.")
        print("Please set GITHUB_TOKEN or GH_TOKEN environment variable")
        print("Example: export GITHUB_TOKEN='your_token_here'")
        sys.exit(1)
    return token

def get_repo_info() -> tuple:
    """Extract owner and repo from git remote"""
    try:
        result = subprocess.run(
            ['git', 'config', '--get', 'remote.origin.url'],
            capture_output=True,
            text=True,
            check=True
        )
        url = result.stdout.strip()
        
        # Parse GitHub URL (handle both HTTPS and SSH)
        if 'github.com' in url:
            if url.startswith('git@'):
                # git@github.com:owner/repo.git
                parts = url.split(':')[1].replace('.git', '').split('/')
            else:
                # https://github.com/owner/repo or https://github.com/owner/repo.git
                parts = url.replace('.git', '').split('/')[-2:]
            
            return parts[0], parts[1]
    except Exception as e:
        print(f"Error extracting repo info: {e}")
        sys.exit(1)

def create_issue_via_api(owner: str, repo: str, token: str, issue_data: Dict) -> bool:
    """Create a GitHub issue using the API"""
    try:
        import requests
        
        url = f"https://api.github.com/repos/{owner}/{repo}/issues"
        headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'title': issue_data['title'],
            'body': issue_data['body'],
            'labels': issue_data['labels']
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 201:
            issue_number = response.json()['number']
            print(f"✓ Created issue #{issue_number}: {issue_data['title']}")
            return True
        else:
            print(f"✗ Failed to create issue: {issue_data['title']}")
            print(f"  Status: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
            
    except ImportError:
        print("Error: requests library not found. Install with: pip install requests")
        sys.exit(1)
    except Exception as e:
        print(f"Error creating issue: {e}")
        return False

def main():
    """Main execution function"""
    # Import issues from the original script
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from create_github_issues import ISSUES
    
    print("=" * 60)
    print("GitHub Issues Creator - API Version")
    print("=" * 60)
    print()
    
    # Check for dry-run mode
    dry_run = '--dry-run' in sys.argv or '--test' in sys.argv or '-n' in sys.argv
    
    if dry_run:
        print("DRY RUN MODE - No issues will be created")
        print()
    
    # Get repository info
    owner, repo = get_repo_info()
    print(f"Repository: {owner}/{repo}")
    print(f"Issues to create: {len(ISSUES)}")
    print()
    
    if dry_run:
        print("Issues that would be created:")
        print()
        for i, issue in enumerate(ISSUES, 1):
            print(f"{i}. {issue['title']}")
            print(f"   Labels: {', '.join(issue['labels'])}")
            print()
        print("=" * 60)
        print(f"Dry run complete. {len(ISSUES)} issues ready to create.")
        print("Run without --dry-run to actually create these issues.")
        print("=" * 60)
        return
    
    # Get GitHub token
    token = get_github_token()
    
    # Confirm before proceeding
    response = input("Do you want to proceed? (y/N): ")
    if response.lower() != 'y':
        print("Aborted.")
        sys.exit(0)
    
    print()
    print("Creating issues...")
    print()
    
    # Create each issue
    created = 0
    failed = 0
    
    for i, issue in enumerate(ISSUES, 1):
        print(f"[{i}/{len(ISSUES)}] ", end="")
        if create_issue_via_api(owner, repo, token, issue):
            created += 1
        else:
            failed += 1
    
    print()
    print("=" * 60)
    print(f"Summary: {created} created, {failed} failed")
    print("=" * 60)
    
    if failed > 0:
        sys.exit(1)

if __name__ == '__main__':
    main()
