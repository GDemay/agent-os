# [Scheduler] Implement agent process runner

## 🎯 Objective
Create the main entry point that starts the scheduler and keeps the system running.

## 📋 Dependencies
- **REQUIRES**: #15 (HeartbeatScheduler)
- **BLOCKS**: None (this is the final runtime piece)

## 🏗️ Implementation Details

### File to Create
`src/runner.ts`

### Implementation
```typescript
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { HeartbeatScheduler } from './scheduler';
import { FileSystemTool } from './tools/FileSystemTool';
import { ShellTool } from './tools/ShellTool';
import { GitTool } from './tools/GitTool';
import { createDatabaseTool } from './tools/DatabaseTool';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 AgentOS Kernel starting...');

  // Initialize scheduler
  const scheduler = new HeartbeatScheduler(prisma);
  await scheduler.initialize();

  // Register tools with agents
  const dbTool = createDatabaseTool(prisma);
  // Tools are registered when agents are created in scheduler

  // Start the heartbeat loop
  scheduler.start();

  console.log('✅ AgentOS Kernel is running');
  console.log('   Press Ctrl+C to stop');

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    scheduler.stop();
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    scheduler.stop();
    await prisma.$disconnect();
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### Add npm script
In `package.json`:
```json
{
  "scripts": {
    "runner": "ts-node src/runner.ts"
  }
}
```

## ✅ Acceptance Criteria
- [ ] Loads environment variables
- [ ] Initializes Prisma client
- [ ] Creates and starts HeartbeatScheduler
- [ ] Handles SIGINT/SIGTERM for graceful shutdown
- [ ] Logs startup and shutdown messages
- [ ] TypeScript compiles without errors
- [ ] `npm run runner` starts the system

## 📁 Files to Create/Modify
- CREATE: `src/runner.ts`
- MODIFY: `package.json` (add runner script)

## 🧪 Verification
```bash
npm run build
npm run runner
# Should see "AgentOS Kernel is running"
# Ctrl+C should gracefully stop
```

## ⏱️ Estimated Time
1 hour

## 🏷️ Labels
`scheduler`, `depends-on-15`
