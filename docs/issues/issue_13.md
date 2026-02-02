# [Tool] Implement Git tool

## 🎯 Objective
Create a Git tool that agents can use to manage branches, commits, and merges.

## 📋 Dependencies
- **REQUIRES**: #12 (Shell tool - Git tool uses shell commands internally)
- **BLOCKS**: None
- **NOTE**: Can be built with direct exec calls if #12 not ready

## 🏗️ Implementation Details

### File to Create
`src/tools/GitTool.ts`

### Implementation
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from '../agents/BaseAgent';

const execAsync = promisify(exec);

export interface GitArgs {
  action: 'branch' | 'checkout' | 'commit' | 'push' | 'pull' | 'merge' | 'diff' | 'status';
  branch?: string;
  message?: string;
  files?: string[];
}

async function git(command: string, cwd?: string): Promise<string> {
  const { stdout } = await execAsync(`git ${command}`, { cwd: cwd || process.cwd() });
  return stdout.trim();
}

export const GitTool: Tool = {
  name: 'git',
  description: 'Git operations: branch, checkout, commit, push, pull, merge, diff, status',
  parameters: {
    action: { type: 'string', enum: ['branch', 'checkout', 'commit', 'push', 'pull', 'merge', 'diff', 'status'] },
    branch: { type: 'string', description: 'Branch name (for branch/checkout/merge)' },
    message: { type: 'string', description: 'Commit message (for commit)' },
    files: { type: 'array', description: 'Files to add (for commit)' }
  },

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { action, branch, message, files } = args as GitArgs;

    try {
      switch (action) {
        case 'status':
          const status = await git('status --porcelain');
          return { success: true, status: status || 'clean' };

        case 'branch':
          if (branch) {
            // Create new branch
            await git(`checkout -b ${branch}`);
            return { success: true, created: branch };
          } else {
            // List branches
            const branches = await git('branch -a');
            return { success: true, branches: branches.split('\n') };
          }

        case 'checkout':
          if (!branch) throw new Error('Branch required for checkout');
          await git(`checkout ${branch}`);
          return { success: true, checkedOut: branch };

        case 'commit':
          if (!message) throw new Error('Message required for commit');
          // Stage files
          if (files && files.length > 0) {
            await git(`add ${files.join(' ')}`);
          } else {
            await git('add -A');
          }
          await git(`commit -m "${message.replace(/"/g, '\\"')}"`);
          return { success: true, committed: message };

        case 'push':
          const currentBranch = await git('branch --show-current');
          await git(`push origin ${currentBranch}`);
          return { success: true, pushed: currentBranch };

        case 'pull':
          await git('pull');
          return { success: true, pulled: true };

        case 'merge':
          if (!branch) throw new Error('Branch required for merge');
          // First checkout main
          await git('checkout main');
          await git('pull origin main');
          // Then merge
          await git(`merge ${branch}`);
          await git('push origin main');
          return { success: true, merged: branch };

        case 'diff':
          const diff = await git('diff HEAD');
          return { success: true, diff };

        default:
          throw new Error(`Unknown git action: ${action}`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      return { success: false, error: err.message || 'Git command failed' };
    }
  }
};
```

### Export
Add to `src/tools/index.ts`:
```typescript
export * from './GitTool';
```

## ✅ Acceptance Criteria
- [ ] `status` returns current git status
- [ ] `branch` creates or lists branches
- [ ] `checkout` switches branches
- [ ] `commit` stages and commits with message
- [ ] `push` pushes current branch to origin
- [ ] `pull` pulls latest from origin
- [ ] `merge` merges branch to main and pushes
- [ ] `diff` shows uncommitted changes
- [ ] Error handling for all operations
- [ ] TypeScript compiles without errors

## 📁 Files to Create/Modify
- CREATE: `src/tools/GitTool.ts`
- MODIFY: `src/tools/index.ts` (add export)

## 🧪 Verification
```bash
npm run build
# Manual test:
# npx ts-node -e "import {GitTool} from './src/tools'; GitTool.execute({action:'status'}).then(console.log)"
```

## ⏱️ Estimated Time
1-2 hours

## 🏷️ Labels
`tool`, `depends-on-12`
