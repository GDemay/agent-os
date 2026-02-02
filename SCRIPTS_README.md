# Issue Creation Scripts

This directory contains scripts to automatically create 10 GitHub issues for the Mission Control development roadmap.

## Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `create_github_issues.py` | Defines all 10 issues and generates shell script | Modify issue content |
| `create_issues.sh` | Pre-generated shell script using `gh` CLI | You have `gh` authenticated |
| `create_issues_api.py` | API-based issue creator with dry-run | Recommended - works everywhere |
| `test_scripts.sh` | Validation suite (16 tests) | Verify scripts work correctly |
| `CREATING_ISSUES.md` | Detailed documentation | Full reference guide |
| `QUICKSTART_ISSUES.md` | Quick start guide | Get started in 2 minutes |

## Quick Start

**Option A: Test First (Safe)**
```bash
./create_issues_api.py --dry-run  # Preview issues
```

**Option B: Create with API**
```bash
pip install requests
export GITHUB_TOKEN='your_token'
./create_issues_api.py
```

**Option C: Create with GitHub CLI**
```bash
gh auth login
./create_issues.sh
```

## What Gets Created

✅ 10 comprehensive GitHub issues  
✅ Organized by development phase (0-3)  
✅ Complete with tasks, deliverables, acceptance criteria  
✅ Properly labeled for tracking  
✅ Dependencies clearly marked  
✅ Time estimates included  

## Scripts Comparison

### create_issues_api.py ⭐ Recommended
- ✅ Works in CI/CD
- ✅ Works without `gh` CLI
- ✅ Has dry-run mode
- ✅ Better error messages
- ✅ Progress indicators
- ⚠️ Requires: `pip install requests`

### create_issues.sh
- ✅ Pre-generated, ready to run
- ✅ Standard GitHub CLI approach
- ⚠️ Requires: `gh` CLI authenticated
- ❌ No dry-run mode
- ❌ Less flexible

### create_github_issues.py
- ✅ Source of truth for issue content
- ✅ Easy to modify issues
- ✅ Generates shell script
- ⚠️ Use this to regenerate `create_issues.sh`

### test_scripts.sh
- ✅ Validates all scripts work
- ✅ 16 comprehensive tests
- ✅ Checks syntax, permissions, content
- ⚠️ Run before creating issues

## Development Workflow

### Making Changes to Issues

1. **Edit the source:**
   ```bash
   nano create_github_issues.py
   # Modify ISSUES array
   ```

2. **Test the changes:**
   ```bash
   ./test_scripts.sh
   ./create_issues_api.py --dry-run
   ```

3. **Regenerate shell script (optional):**
   ```bash
   python3 create_github_issues.py > create_issues.sh
   chmod +x create_issues.sh
   ```

4. **Create issues:**
   ```bash
   ./create_issues_api.py
   ```

## CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Create Issues
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    pip install requests
    ./create_issues_api.py --dry-run  # Preview
    # Remove --dry-run to actually create
```

## Testing

Run the full test suite:
```bash
./test_scripts.sh
```

This validates:
- Python syntax ✓
- Shell syntax ✓
- File permissions ✓
- Script output ✓
- Issue count (must be 10) ✓
- Issue structure ✓
- Required fields present ✓

## Documentation

- **Quick Start:** `QUICKSTART_ISSUES.md` - Get started in 2 minutes
- **Full Guide:** `CREATING_ISSUES.md` - Complete documentation
- **This File:** Overview and reference

## Support

Having issues?

1. ✅ Run tests: `./test_scripts.sh`
2. ✅ Try dry run: `./create_issues_api.py --dry-run`
3. ✅ Check docs: `CREATING_ISSUES.md`
4. ✅ Verify token: `echo $GITHUB_TOKEN`
5. ✅ Check repo: `git remote -v`

## License

Same as parent repository.

---

**Ready to create issues?** → See `QUICKSTART_ISSUES.md`
