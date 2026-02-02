import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from '../agents/BaseAgent';

const execAsync = promisify(exec);

/**
 * Arguments for Git tool operations
 */
export interface GitArgs {
  action:
    | 'status'
    | 'branch'
    | 'checkout'
    | 'commit'
    | 'push'
    | 'pull'
    | 'merge'
    | 'diff'
    | 'log'
    | 'stash'
    | 'add';
  branch?: string;
  message?: string;
  files?: string[];
  remote?: string;
  count?: number; // For log
}

/**
 * Execute a git command
 */
async function git(command: string, cwd?: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`git ${command}`, {
      cwd: cwd || process.cwd(),
      maxBuffer: 1024 * 1024 * 5, // 5MB for large diffs
    });
    return stdout.trim();
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string };
    throw new Error(err.stderr || err.message || 'Git command failed');
  }
}

/**
 * Git Tool - Provides git operations for agents
 *
 * Actions:
 * - status: Get working tree status
 * - branch: Create or list branches
 * - checkout: Switch branches
 * - add: Stage files
 * - commit: Commit staged changes
 * - push: Push to remote
 * - pull: Pull from remote
 * - merge: Merge branch into current
 * - diff: Show changes
 * - log: Show commit history
 * - stash: Stash changes
 */
export const GitTool: Tool = {
  name: 'git',
  description:
    'Git operations: status, branch, checkout, add, commit, push, pull, merge, diff, log, stash',
  parameters: {
    action: {
      type: 'string',
      enum: [
        'status',
        'branch',
        'checkout',
        'add',
        'commit',
        'push',
        'pull',
        'merge',
        'diff',
        'log',
        'stash',
      ],
    },
    branch: { type: 'string', description: 'Branch name (for branch/checkout/merge)' },
    message: { type: 'string', description: 'Commit message (for commit) or stash message' },
    files: { type: 'array', description: 'Files to add (for add/commit)' },
    remote: { type: 'string', description: 'Remote name (default: origin)' },
    count: { type: 'number', description: 'Number of commits (for log, default: 10)' },
  },

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const {
      action,
      branch,
      message,
      files,
      remote = 'origin',
      count = 10,
    } = args as unknown as GitArgs;

    try {
      switch (action) {
        case 'status': {
          const status = await git('status --porcelain');
          const branch = await git('branch --show-current');
          const lines = status ? status.split('\n') : [];
          const parsed = lines.map((line) => ({
            status: line.substring(0, 2).trim(),
            file: line.substring(3),
          }));
          return {
            success: true,
            branch,
            clean: lines.length === 0,
            changes: parsed,
            count: parsed.length,
          };
        }

        case 'branch': {
          if (branch) {
            // Create new branch
            await git(`checkout -b ${branch}`);
            return { success: true, action: 'created', branch };
          } else {
            // List branches
            const local = await git('branch');
            const current = await git('branch --show-current');
            const branches = local
              .split('\n')
              .map((b) => b.replace('* ', '').trim())
              .filter(Boolean);
            return {
              success: true,
              current,
              branches,
              count: branches.length,
            };
          }
        }

        case 'checkout': {
          if (!branch) {
            throw new Error('Branch name required for checkout');
          }
          // Check if branch exists
          try {
            await git(`rev-parse --verify ${branch}`);
            await git(`checkout ${branch}`);
          } catch {
            // Branch doesn't exist, create it
            await git(`checkout -b ${branch}`);
          }
          return { success: true, action: 'checked out', branch };
        }

        case 'add': {
          if (files && files.length > 0) {
            // Escape file paths
            const escapedFiles = files.map((f) => `"${f}"`).join(' ');
            await git(`add ${escapedFiles}`);
            return { success: true, action: 'staged', files };
          } else {
            await git('add -A');
            return { success: true, action: 'staged all' };
          }
        }

        case 'commit': {
          if (!message) {
            throw new Error('Commit message required');
          }
          // Escape message for shell
          const escapedMessage = message.replace(/"/g, '\\"').replace(/\$/g, '\\$');

          // Stage files if specified
          if (files && files.length > 0) {
            const escapedFiles = files.map((f) => `"${f}"`).join(' ');
            await git(`add ${escapedFiles}`);
          }

          await git(`commit -m "${escapedMessage}"`);
          const hash = await git('rev-parse --short HEAD');
          return { success: true, action: 'committed', hash, message };
        }

        case 'push': {
          const currentBranch = await git('branch --show-current');
          const targetBranch = branch || currentBranch;

          // Set upstream if pushing for the first time
          try {
            await git(`push ${remote} ${targetBranch}`);
          } catch {
            await git(`push -u ${remote} ${targetBranch}`);
          }

          return { success: true, action: 'pushed', remote, branch: targetBranch };
        }

        case 'pull': {
          const currentBranch = await git('branch --show-current');
          await git(`pull ${remote} ${branch || currentBranch}`);
          return { success: true, action: 'pulled', remote, branch: branch || currentBranch };
        }

        case 'merge': {
          if (!branch) {
            throw new Error('Branch name required for merge');
          }

          // Get current branch
          const currentBranch = await git('branch --show-current');

          // Perform merge
          try {
            await git(`merge ${branch}`);
            return {
              success: true,
              action: 'merged',
              source: branch,
              target: currentBranch,
            };
          } catch (mergeError: unknown) {
            const err = mergeError as { message?: string };
            // Check for conflicts
            const status = await git('status --porcelain');
            if (status.includes('UU') || status.includes('AA') || status.includes('DD')) {
              return {
                success: false,
                error: 'Merge conflict detected',
                conflicts: status
                  .split('\n')
                  .filter((l) => l.match(/^(UU|AA|DD)/))
                  .map((l) => l.substring(3)),
              };
            }
            throw new Error(err.message || 'Merge failed');
          }
        }

        case 'diff': {
          const diffOutput = branch ? await git(`diff ${branch}`) : await git('diff HEAD');

          // Parse diff for summary
          const files = diffOutput.match(/diff --git a\/.+ b\/.+/g) || [];

          return {
            success: true,
            diff:
              diffOutput.length > 10000
                ? diffOutput.substring(0, 10000) + '\n... (truncated)'
                : diffOutput,
            filesChanged: files.length,
          };
        }

        case 'log': {
          const logOutput = await git(`log --oneline -n ${count}`);
          const commits = logOutput
            .split('\n')
            .filter(Boolean)
            .map((line) => {
              const [hash, ...rest] = line.split(' ');
              return { hash, message: rest.join(' ') };
            });

          return { success: true, commits, count: commits.length };
        }

        case 'stash': {
          if (message) {
            await git(`stash push -m "${message.replace(/"/g, '\\"')}"`);
            return { success: true, action: 'stashed', message };
          } else {
            // List stashes
            const stashes = await git('stash list');
            return {
              success: true,
              stashes: stashes ? stashes.split('\n') : [],
            };
          }
        }

        default:
          throw new Error(`Unknown git action: ${action}`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        success: false,
        error: err.message || 'Git command failed',
        action,
      };
    }
  },
};
