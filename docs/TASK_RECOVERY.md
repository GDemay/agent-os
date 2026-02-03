# Task Recovery & Timeout System

## Problem
When the AgentOS kernel stops (crash, Ctrl+C, system shutdown), tasks that were in progress become "stuck" - they remain in `assigned` or `in_progress` status indefinitely, blocking the system.

## Solution
We've implemented a **two-layer recovery system**:

### 1. Automatic Recovery (Kernel Watchdog)
When the kernel is running, it automatically monitors for stuck tasks:

- **Check Interval**: Every 2 minutes
- **Timeout**: 15 minutes
- **Action**: Resets stuck tasks to `inbox` and re-dispatches them

The watchdog runs continuously in the background and will:
1. Find tasks stuck for more than 15 minutes
2. Reset them to inbox status
3. Clear assignee
4. Add error message explaining the timeout
5. Re-dispatch the task for processing

### 2. Manual Cleanup Script
For situations when the kernel was stopped with stuck tasks:

```bash
npm run cleanup
```

This script will:
- Find all tasks in `assigned` or `in_progress` status for >15 minutes
- Reset them to `inbox`
- Reset all agents to `idle`
- Add error messages explaining the reset

## Usage

### Check Task Status
```bash
npm run check-tasks
```

Shows all active tasks with:
- Title and status
- Assignee and their status
- Time elapsed since started
- Branch name

### Clean Up Stuck Tasks
```bash
npm run cleanup
```

Run this after:
- Kernel crash
- Manual kernel stop (Ctrl+C)
- System restart
- Long idle periods

### Normal Operation
Just run the kernel normally:
```bash
npm run kernel
```

The watchdog will handle stuck tasks automatically.

## Configuration

In `src/kernel.ts`:
```typescript
private readonly TASK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
```

Change this value to adjust the timeout threshold.

Recovery interval (in `startRecoveryProcess`):
```typescript
}, 2 * 60 * 1000); // Every 2 minutes
```

## When Tasks Get Stuck

Tasks can get stuck when:
1. **Kernel stopped mid-execution** - Most common
2. **Agent crashes** - Agent process dies but task remains assigned
3. **LLM timeout** - API call hangs indefinitely
4. **Tool execution hangs** - Shell command or git operation blocks
5. **Network issues** - NVIDIA NIM API unreachable

The recovery system catches all of these cases.

## Monitoring

Watch kernel logs for recovery messages:
```
[Kernel] ⚠️  Found 3 stuck tasks - resetting...
  - Resetting: Create user authentication module (stuck for 18 min)
  - Resetting: Fix navigation bug (stuck for 22 min)
```

## Best Practices

1. **Before stopping kernel**: Let it finish current tasks (check with `npm run check-tasks`)
2. **After restart**: Run `npm run cleanup` to clear any stuck tasks
3. **Monitor logs**: Watch for timeout warnings
4. **Adjust timeout**: If tasks legitimately take >15min, increase `TASK_TIMEOUT_MS`

## Technical Details

The recovery process:
1. Queries database for tasks with `status IN ('assigned', 'in_progress')`
2. Filters those with `startedAt < now - TIMEOUT`
3. Updates each to `status = 'inbox'`, clears `assigneeId` and `startedAt`
4. Dispatches `task:created` event to re-process
5. Orchestrator will re-break-down and reassign

This ensures no task is permanently lost.
