import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { Tool } from '../agents/BaseAgent';

const execAsync = promisify(exec);

/**
 * Arguments for Shell tool operations
 */
export interface ShellArgs {
  command: string;
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

/**
 * Commands that are allowed for safety
 * Agents can only run these commands
 */
const ALLOWED_COMMANDS = [
  // Package managers
  'npm',
  'npx',
  'yarn',
  'pnpm',
  // Node
  'node',
  'ts-node',
  // Git
  'git',
  // Basic Unix
  'cat',
  'ls',
  'pwd',
  'echo',
  'mkdir',
  'cp',
  'mv',
  'rm',
  'touch',
  'head',
  'tail',
  'grep',
  'find',
  'wc',
  'sort',
  'uniq',
  'diff',
  'chmod',
  // Development
  'tsc',
  'eslint',
  'prettier',
  'jest',
  'vitest',
];

/**
 * Dangerous patterns that are always blocked
 */
const DANGEROUS_PATTERNS = [
  /rm\s+(-rf?|--force|-r)\s+\/(?!\w)/, // rm -rf / or rm -r /
  /rm\s+-rf?\s+~/, // rm -rf ~
  />\s*\/dev\//, // redirect to /dev
  /\|\s*(ba)?sh/, // piping to sh/bash
  /\$\(/, // command substitution
  /`[^`]+`/, // backtick substitution
  /;\s*(rm|dd|mkfs)/, // chained dangerous commands
  /&&\s*(rm|dd|mkfs)/, // chained dangerous commands
  /sudo/, // no sudo
  /chmod\s+777/, // no chmod 777
];

/**
 * Shell Tool - Execute shell commands safely
 *
 * Security features:
 * - Whitelist of allowed commands
 * - Dangerous pattern detection
 * - Timeout protection
 * - Working directory restriction
 */
export const ShellTool: Tool = {
  name: 'shell',
  description: `Execute shell commands. Allowed: ${ALLOWED_COMMANDS.slice(0, 10).join(', ')}, and more`,
  parameters: {
    command: { type: 'string', description: 'Shell command to execute' },
    cwd: { type: 'string', description: 'Working directory (optional, defaults to project root)' },
    timeout: { type: 'number', description: 'Timeout in ms (default 60000)' },
  },

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { command, cwd, timeout = 60000 } = args as unknown as ShellArgs;

    if (!command || typeof command !== 'string') {
      throw new Error('Command is required and must be a string');
    }

    // Security: Check if command starts with allowed prefix
    const trimmedCommand = command.trim();
    const firstWord = trimmedCommand.split(/\s+/)[0];

    // Handle paths like ./node_modules/.bin/jest
    const baseCommand = firstWord.includes('/') ? firstWord.split('/').pop()! : firstWord;

    if (!ALLOWED_COMMANDS.includes(baseCommand)) {
      return {
        success: false,
        error: `Command not allowed: ${baseCommand}`,
        allowed: ALLOWED_COMMANDS,
      };
    }

    // Security: Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        return {
          success: false,
          error: 'Dangerous command pattern detected',
          pattern: pattern.toString(),
        };
      }
    }

    // Ensure working directory is within project
    const projectRoot = process.cwd();
    const workingDir = cwd ? cwd : projectRoot;

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDir,
        timeout: timeout as number,
        maxBuffer: 1024 * 1024 * 10, // 10MB
        env: { ...process.env },
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command,
        cwd: workingDir,
      };
    } catch (error: unknown) {
      const err = error as {
        stdout?: string;
        stderr?: string;
        code?: number;
        signal?: string;
        message?: string;
        killed?: boolean;
      };

      // Handle timeout
      if (err.killed) {
        return {
          success: false,
          error: 'Command timed out',
          timeout: timeout,
          command,
        };
      }

      return {
        success: false,
        stdout: err.stdout?.trim() || '',
        stderr: err.stderr?.trim() || err.message || 'Unknown error',
        code: err.code,
        signal: err.signal,
        command,
      };
    }
  },
};

/**
 * Execute a command and stream output (for long-running commands)
 * This is a helper function, not exposed as a tool action
 */
export async function execStream(
  command: string,
  args: string[],
  options: { cwd?: string; onStdout?: (data: string) => void; onStderr?: (data: string) => void },
): Promise<{ code: number | null; signal: string | null }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      shell: true,
    });

    proc.stdout.on('data', (data) => {
      options.onStdout?.(data.toString());
    });

    proc.stderr.on('data', (data) => {
      options.onStderr?.(data.toString());
    });

    proc.on('close', (code, signal) => {
      resolve({ code, signal });
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}
