import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from '../agents/BaseAgent';

/**
 * Arguments for FileSystem tool operations
 */
export interface FileSystemArgs {
  action: 'read' | 'write' | 'append' | 'list' | 'exists' | 'delete' | 'mkdir' | 'search';
  path: string;
  content?: string;
  pattern?: string; // For search action
  recursive?: boolean; // For list/search
}

/**
 * FileSystem Tool - Provides file operations for agents
 *
 * Security features:
 * - Path traversal prevention (no escape from project root)
 * - Relative path enforcement
 *
 * Actions:
 * - read: Read file contents
 * - write: Create/overwrite file
 * - append: Append to file
 * - list: List directory contents
 * - exists: Check if path exists
 * - delete: Remove file
 * - mkdir: Create directory
 * - search: Find files matching pattern
 */
export const FileSystemTool: Tool = {
  name: 'filesystem',
  description:
    'Read, write, list, and manage files. Actions: read, write, append, list, exists, delete, mkdir, search',
  parameters: {
    action: {
      type: 'string',
      enum: ['read', 'write', 'append', 'list', 'exists', 'delete', 'mkdir', 'search'],
    },
    path: { type: 'string', description: 'Relative path from project root' },
    content: { type: 'string', description: 'Content to write (for write/append action)' },
    pattern: { type: 'string', description: 'Glob pattern (for search action)' },
    recursive: { type: 'boolean', description: 'Recursive operation (for list/search)' },
  },

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { action, path: filePath, content, pattern, recursive } = args as unknown as FileSystemArgs;
    const projectRoot = process.cwd();
    const fullPath = path.resolve(projectRoot, filePath);

    // Security: Ensure path is within project root
    if (!fullPath.startsWith(projectRoot)) {
      throw new Error('Path traversal not allowed: path must be within project root');
    }

    switch (action) {
      case 'read':
        try {
          const fileContent = await fs.readFile(fullPath, 'utf-8');
          return {
            success: true,
            path: filePath,
            content: fileContent,
            size: fileContent.length,
          };
        } catch (error: unknown) {
          const err = error as { code?: string; message?: string };
          if (err.code === 'ENOENT') {
            return { success: false, error: `File not found: ${filePath}` };
          }
          throw error;
        }

      case 'write':
        if (content === undefined) {
          throw new Error('Content required for write action');
        }
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
        return {
          success: true,
          path: filePath,
          action: 'written',
          size: content.length,
        };

      case 'append':
        if (content === undefined) {
          throw new Error('Content required for append action');
        }
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.appendFile(fullPath, content, 'utf-8');
        return {
          success: true,
          path: filePath,
          action: 'appended',
          size: content.length,
        };

      case 'list': {
        try {
          const entries = await fs.readdir(fullPath, { withFileTypes: true });
          const result = entries.map((e) => ({
            name: e.name,
            type: e.isDirectory() ? 'directory' : 'file',
            path: path.join(filePath, e.name),
          }));

          // Recursive listing if requested
          if (recursive) {
            const allEntries: Array<{ name: string; type: string; path: string }> = [];
            const listRecursive = async (dir: string, relativePath: string) => {
              const items = await fs.readdir(dir, { withFileTypes: true });
              for (const item of items) {
                const itemPath = path.join(relativePath, item.name);
                allEntries.push({
                  name: item.name,
                  type: item.isDirectory() ? 'directory' : 'file',
                  path: itemPath,
                });
                if (item.isDirectory()) {
                  await listRecursive(path.join(dir, item.name), itemPath);
                }
              }
            };
            await listRecursive(fullPath, filePath);
            return { success: true, entries: allEntries, count: allEntries.length };
          }

          return { success: true, entries: result, count: result.length };
        } catch (error: unknown) {
          const err = error as { code?: string };
          if (err.code === 'ENOENT') {
            return { success: false, error: `Directory not found: ${filePath}` };
          }
          throw error;
        }
      }

      case 'exists':
        try {
          const stats = await fs.stat(fullPath);
          return {
            success: true,
            exists: true,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
          };
        } catch {
          return { success: true, exists: false };
        }

      case 'delete':
        try {
          const stats = await fs.stat(fullPath);
          if (stats.isDirectory()) {
            await fs.rm(fullPath, { recursive: true });
          } else {
            await fs.unlink(fullPath);
          }
          return { success: true, deleted: filePath };
        } catch (error: unknown) {
          const err = error as { code?: string };
          if (err.code === 'ENOENT') {
            return { success: false, error: `Path not found: ${filePath}` };
          }
          throw error;
        }

      case 'mkdir':
        await fs.mkdir(fullPath, { recursive: true });
        return { success: true, created: filePath };

      case 'search': {
        if (!pattern) {
          throw new Error('Pattern required for search action');
        }
        const matches: string[] = [];
        const searchRecursive = async (dir: string, relativePath: string) => {
          try {
            const items = await fs.readdir(dir, { withFileTypes: true });
            for (const item of items) {
              const itemPath = path.join(relativePath, item.name);
              // Simple glob matching (supports * and ?)
              const regex = new RegExp(
                '^' +
                  pattern
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*')
                    .replace(/\?/g, '.') +
                  '$'
              );
              if (regex.test(item.name)) {
                matches.push(itemPath);
              }
              if (item.isDirectory() && recursive !== false) {
                await searchRecursive(path.join(dir, item.name), itemPath);
              }
            }
          } catch {
            // Ignore permission errors, etc.
          }
        };
        await searchRecursive(fullPath, filePath);
        return { success: true, matches, count: matches.length };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  },
};
