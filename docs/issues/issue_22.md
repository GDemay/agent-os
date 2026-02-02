# [Test] Validate self-improvement: Add new tool

## 🎯 Objective
The ultimate test: Have the system create a new tool for itself. This validates the "self-improvement" capability.

## 📋 Dependencies
- **REQUIRES**: All core components (#6, #7, #8, #9, #10, #12, #13, #14, #15, #16)
- **BLOCKS**: None (this is the final validation)

## 🏗️ Test Procedure

### Step 1: Create a goal task
```bash
npm run cli task create --title "Create a WebSearch tool that can search the web using DuckDuckGo"
```

### Step 2: Start the system
```bash
npm run runner
```

### Step 3: Observe
The system should:
1. **Orchestrator**: Break down the goal into subtasks
   - Research DuckDuckGo API
   - Create WebSearchTool.ts file
   - Add tool to exports
   - Write tests
2. **Worker**: Execute each subtask
   - Create the file
   - Write the code
   - Run tests
3. **Reviewer**: Validate the work
   - Check code quality
   - Run tests
   - Merge to main

### Expected Outcome
After completion, the codebase should contain:
- `src/tools/WebSearchTool.ts` (new file)
- Updated `src/tools/index.ts` (new export)
- Commits from the Worker agent
- Activity log showing the full process

## ✅ Acceptance Criteria
- [ ] System creates subtasks automatically
- [ ] Worker writes new tool code
- [ ] Code compiles without errors
- [ ] Reviewer approves the changes
- [ ] Changes are merged to main
- [ ] Activity log shows full workflow

## 🧪 Verification
```bash
# After system completes:
git log --oneline -5  # Should show commits from agents
ls src/tools/  # Should include WebSearchTool.ts
npm run build  # Should compile successfully
```

## ⏱️ Estimated Time
1-2 hours (mostly waiting for agents)

## 🏷️ Labels
`test`, `validation`, `depends-on-all`
