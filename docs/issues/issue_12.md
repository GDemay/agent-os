# [Tool] Implement Shell tool

## 🎯 Objective
Create a Shell tool that agents can use to execute shell commands (npm, git, tests, etc).

## 📋 Dependencies
- **REQUIRES**: None (independent)
- **BLOCKS**: None
- **PARALLEL**: Can be built alongside #10, #13, #14

## 🏗️ Implementation Details

### File to Create
`src/tools/ShellTool.ts`

### Implementation
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from '../agents/BaseAgent';

const execAsync = promisify(exec);

export interface ShellArgs {
  command: string;
  cwd?: string;
  timeout?: number;
}

// Commands that are allowed for safety
const ALLOWED_COMMANDS = [
  'npm', 'npx', 'node', 'git', 'cat', 'ls', 'pwd', 'echo',
  'mkdir', 'cp', 'mv', 'rm', 'touch', 'head', 'tail', 'grep'
];

export const ShellTool: Tool = {
  name: 'shell',
  description: 'Execute shell commands. Allowed: npm, npx, node, git, basic unix commands',
  parameters: {
    command: { type: 'string', description: 'Shell command to execute' },
    cwd: { type: 'string', description: 'Working directory (optional)' },
    timeout: { type: 'number', description: 'Timeout in ms (default 30000)' }
  },

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { command, cwd, timeout = 30000 } = args as ShellArgs;
    
    // Security: Check if command starts with allowed prefix
    const firstWord = command.trim().split(/\s+/)[0];
    if (!ALLOWED_COMMANDS.some(cmd => firstWord === cmd || firstWord.endsWith(`/${cmd}`))) {
      throw new Error(`Command not allowed: ${firstWord}. Allowed: ${ALLOWED_COMMANDS.join(', ')}`);
    }

    // Security: Block dangerous patterns
    const dangerousPatterns = [
      /rm\s+-rf\s+\//, // rm -rf /
      />\s*\/dev\//, // redirect to /dev
      /\|\s*sh/, // piping to sh
      /\$\(/, // command substitution
      /`/, // backtick substitution
    ];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        throw new Error('Dangerous command pattern detected');
      }
    }

    const workingDir = cwd || process.cwd();

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDir,
        timeout: timeout as number,
        maxBuffer: 1024 * 1024 * 10 // 10MB
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command
      };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; code?: number; message?: string };
      return {
        success: false,
        stdout: err.stdout || '',
        stderr: err.stderr || err.message || 'Unknown error',
        code: err.code,
        command
      };
    }
  }
};
```

### Export
Add to `src/tools/index.ts`:
```typescript
export * from './ShellTool';
```

## ✅ Acceptance Criteria
- [ ] Executes allowed commands (npm, git, node, etc)
- [ ] Returns stdout/stderr in response
- [ ] Blocks dangerous commands (rm -rf /, etc)
- [ ] Blocks disallowed commands
- [ ] Handles command timeout
- [ ] Handles command failure gracefully
- [ ] TypeScript compiles without errors

## 📁 Files to Create/Modify
- CREATE: `src/tools/ShellTool.ts`
- MODIFY: `src/tools/index.ts` (add export)

## 🧪 Verification
```bash
npm run build
# Manual test:
# npx ts-node -e "import {ShellTool} from './src/tools'; ShellTool.execute({command:'ls -la'}).then(console.log)"
```

## ⏱️ Estimated Time
1-2 hours

## 🏷️ Labels
`tool`, `independent`, `parallel-safe`
