# [Tool] Implement FileSystem tool

## 🎯 Objective
Create a FileSystem tool that agents can use to read, write, list, and manage files in the project.

## 📋 Dependencies
- **REQUIRES**: None (independent)
- **BLOCKS**: None (but Worker agent #8 needs this for full functionality)
- **PARALLEL**: Can be built alongside #12, #13, #14

## 🏗️ Implementation Details

### File to Create
`src/tools/FileSystemTool.ts`

### Tool Interface (from BaseAgent)
```typescript
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}
```

### Implementation
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from '../agents/BaseAgent';

export interface FileSystemArgs {
  action: 'read' | 'write' | 'list' | 'exists' | 'delete';
  path: string;
  content?: string;
}

export const FileSystemTool: Tool = {
  name: 'filesystem',
  description: 'Read, write, list, and manage files. Actions: read, write, list, exists, delete',
  parameters: {
    action: { type: 'string', enum: ['read', 'write', 'list', 'exists', 'delete'] },
    path: { type: 'string', description: 'Relative path from project root' },
    content: { type: 'string', description: 'Content to write (for write action)' }
  },
  
  async execute(args: Record<string, unknown>): Promise<unknown> {
    const { action, path: filePath, content } = args as FileSystemArgs;
    const projectRoot = process.cwd();
    const fullPath = path.resolve(projectRoot, filePath);
    
    // Security: Ensure path is within project
    if (!fullPath.startsWith(projectRoot)) {
      throw new Error('Path traversal not allowed');
    }

    switch (action) {
      case 'read':
        return await fs.readFile(fullPath, 'utf-8');
      
      case 'write':
        if (!content) throw new Error('Content required for write');
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
        return { success: true, path: filePath };
      
      case 'list':
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        return entries.map(e => ({
          name: e.name,
          type: e.isDirectory() ? 'directory' : 'file'
        }));
      
      case 'exists':
        try {
          await fs.access(fullPath);
          return { exists: true };
        } catch {
          return { exists: false };
        }
      
      case 'delete':
        await fs.unlink(fullPath);
        return { success: true, deleted: filePath };
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
};
```

### Export
Create `src/tools/index.ts`:
```typescript
export * from './FileSystemTool';
```

## ✅ Acceptance Criteria
- [ ] `read` action returns file contents as string
- [ ] `write` action creates/updates file with content
- [ ] `list` action returns directory entries with types
- [ ] `exists` action returns boolean
- [ ] `delete` action removes file
- [ ] Path traversal prevention (no `../` escapes)
- [ ] TypeScript compiles without errors

## 📁 Files to Create/Modify
- CREATE: `src/tools/FileSystemTool.ts`
- CREATE: `src/tools/index.ts`

## 🧪 Verification
```bash
npm run build
# Manual test:
# npx ts-node -e "import {FileSystemTool} from './src/tools'; FileSystemTool.execute({action:'list',path:'src'}).then(console.log)"
```

## ⏱️ Estimated Time
1-2 hours

## 🏷️ Labels
`tool`, `independent`, `parallel-safe`
