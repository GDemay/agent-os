# [Tool] Implement Database tool (Task/Message CRUD)

## 🎯 Objective
Create a Database tool that agents can use to manage Tasks and Messages without direct Prisma calls.

## 📋 Dependencies
- **REQUIRES**: None (independent, uses existing Prisma schema)
- **BLOCKS**: None
- **PARALLEL**: Can be built alongside #10, #12, #13

## 🏗️ Implementation Details

### File to Create
`src/tools/DatabaseTool.ts`

### Prisma Schema Reference
```prisma
model Task {
  id           String    @id @default(uuid())
  title        String
  description  String?
  status       String    @default("inbox")  // inbox, assigned, in_progress, review, done, blocked
  priority     Int       @default(0)
  assigneeId   String?
  createdById  String?
  parentTaskId String?
  branchName   String?
  result       String?
  error        String?
}

model Message {
  id          String   @id @default(uuid())
  taskId      String?
  fromAgentId String?
  toAgentId   String?
  content     String
  messageType String   @default("comment")
  read        Boolean  @default(false)
}
```

### Implementation
```typescript
import { PrismaClient } from '@prisma/client';
import { Tool } from '../agents/BaseAgent';

export interface DatabaseArgs {
  entity: 'task' | 'message';
  action: 'create' | 'read' | 'update' | 'list';
  id?: string;
  data?: Record<string, unknown>;
  filter?: Record<string, unknown>;
}

export function createDatabaseTool(prisma: PrismaClient): Tool {
  return {
    name: 'database',
    description: 'CRUD operations for Tasks and Messages. Entities: task, message. Actions: create, read, update, list',
    parameters: {
      entity: { type: 'string', enum: ['task', 'message'] },
      action: { type: 'string', enum: ['create', 'read', 'update', 'list'] },
      id: { type: 'string', description: 'Entity ID (for read/update)' },
      data: { type: 'object', description: 'Data for create/update' },
      filter: { type: 'object', description: 'Filter for list' }
    },

    async execute(args: Record<string, unknown>): Promise<unknown> {
      const { entity, action, id, data, filter } = args as DatabaseArgs;

      if (entity === 'task') {
        switch (action) {
          case 'create':
            return await prisma.task.create({ data: data as any });
          case 'read':
            if (!id) throw new Error('ID required for read');
            return await prisma.task.findUnique({ where: { id } });
          case 'update':
            if (!id) throw new Error('ID required for update');
            return await prisma.task.update({ where: { id }, data: data as any });
          case 'list':
            return await prisma.task.findMany({ where: filter as any, take: 50 });
        }
      }

      if (entity === 'message') {
        switch (action) {
          case 'create':
            return await prisma.message.create({ data: data as any });
          case 'read':
            if (!id) throw new Error('ID required for read');
            return await prisma.message.findUnique({ where: { id } });
          case 'update':
            if (!id) throw new Error('ID required for update');
            return await prisma.message.update({ where: { id }, data: data as any });
          case 'list':
            return await prisma.message.findMany({
              where: filter as any,
              take: 100,
              orderBy: { createdAt: 'desc' }
            });
        }
      }

      throw new Error(`Unknown entity: ${entity}`);
    }
  };
}
```

### Export
Add to `src/tools/index.ts`:
```typescript
export * from './DatabaseTool';
```

## ✅ Acceptance Criteria
- [ ] `create` task/message works
- [ ] `read` single task/message by ID
- [ ] `update` task/message by ID
- [ ] `list` tasks/messages with optional filter
- [ ] Factory function accepts PrismaClient
- [ ] TypeScript compiles without errors

## 📁 Files to Create/Modify
- CREATE: `src/tools/DatabaseTool.ts`
- MODIFY: `src/tools/index.ts` (add export)

## 🧪 Verification
```bash
npm run build
```

## ⏱️ Estimated Time
1-2 hours

## 🏷️ Labels
`tool`, `independent`, `parallel-safe`
