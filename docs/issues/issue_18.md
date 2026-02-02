# [CLI] Implement command-line interface

## 🎯 Objective
Create a CLI tool (`agentos`) for interacting with the system: creating tasks, viewing status, etc.

## 📋 Dependencies
- **REQUIRES**: Prisma schema (already done)
- **BLOCKS**: None
- **PARALLEL**: Can be built independently of agents

## 🏗️ Implementation Details

### File to Create
`src/cli/index.ts`

### Dependencies to Install
```bash
npm install commander chalk
npm install -D @types/chalk
```

### Implementation
```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const program = new Command();

program
  .name('agentos')
  .description('AgentOS CLI - Manage your autonomous development system')
  .version('1.0.0');

// Task commands
program
  .command('task')
  .description('Manage tasks')
  .argument('<action>', 'create | list | show | update')
  .option('-t, --title <title>', 'Task title')
  .option('-d, --desc <description>', 'Task description')
  .option('-p, --priority <priority>', 'Priority (0-10)', '0')
  .option('-s, --status <status>', 'Status filter')
  .option('-i, --id <id>', 'Task ID')
  .action(async (action, options) => {
    switch (action) {
      case 'create':
        if (!options.title) {
          console.error(chalk.red('Title required: --title "Task title"'));
          process.exit(1);
        }
        const task = await prisma.task.create({
          data: {
            title: options.title,
            description: options.desc || '',
            priority: parseInt(options.priority),
            status: 'inbox'
          }
        });
        console.log(chalk.green(`✓ Created task: ${task.id}`));
        console.log(`  Title: ${task.title}`);
        break;

      case 'list':
        const tasks = await prisma.task.findMany({
          where: options.status ? { status: options.status } : {},
          orderBy: { priority: 'desc' },
          take: 20
        });
        console.log(chalk.bold('\nTasks:'));
        for (const t of tasks) {
          const statusColor = {
            inbox: chalk.gray,
            assigned: chalk.blue,
            in_progress: chalk.yellow,
            review: chalk.magenta,
            done: chalk.green,
            blocked: chalk.red
          }[t.status] || chalk.white;
          console.log(`  ${statusColor(`[${t.status.padEnd(11)}]`)} ${t.title.substring(0, 50)}`);
          console.log(chalk.gray(`    ID: ${t.id}`));
        }
        break;

      case 'show':
        if (!options.id) {
          console.error(chalk.red('ID required: --id <task-id>'));
          process.exit(1);
        }
        const single = await prisma.task.findUnique({ where: { id: options.id } });
        if (!single) {
          console.error(chalk.red('Task not found'));
          process.exit(1);
        }
        console.log(chalk.bold(`\nTask: ${single.title}`));
        console.log(`  ID: ${single.id}`);
        console.log(`  Status: ${single.status}`);
        console.log(`  Priority: ${single.priority}`);
        console.log(`  Description: ${single.description || 'None'}`);
        break;

      case 'update':
        if (!options.id) {
          console.error(chalk.red('ID required: --id <task-id>'));
          process.exit(1);
        }
        const updateData: any = {};
        if (options.status) updateData.status = options.status;
        if (options.title) updateData.title = options.title;
        if (options.priority) updateData.priority = parseInt(options.priority);
        await prisma.task.update({ where: { id: options.id }, data: updateData });
        console.log(chalk.green('✓ Task updated'));
        break;
    }
    await prisma.$disconnect();
  });

// Agent commands
program
  .command('agent')
  .description('View agent status')
  .argument('<action>', 'list | show')
  .option('-i, --id <id>', 'Agent ID')
  .action(async (action, options) => {
    switch (action) {
      case 'list':
        const agents = await prisma.agent.findMany();
        console.log(chalk.bold('\nAgents:'));
        for (const a of agents) {
          const statusIcon = a.status === 'online' ? '🟢' : a.status === 'busy' ? '🟡' : '⚫';
          console.log(`  ${statusIcon} ${a.name} (${a.role}) - ${a.status}`);
        }
        break;

      case 'show':
        if (!options.id) {
          console.error(chalk.red('ID required: --id <agent-id>'));
          process.exit(1);
        }
        const agent = await prisma.agent.findUnique({ where: { id: options.id } });
        if (!agent) {
          console.error(chalk.red('Agent not found'));
          process.exit(1);
        }
        console.log(chalk.bold(`\nAgent: ${agent.name}`));
        console.log(`  Role: ${agent.role}`);
        console.log(`  Status: ${agent.status}`);
        console.log(`  Last Heartbeat: ${agent.lastHeartbeat || 'Never'}`);
        break;
    }
    await prisma.$disconnect();
  });

// Status command
program
  .command('status')
  .description('Show system status')
  .action(async () => {
    const agents = await prisma.agent.findMany();
    const tasks = await prisma.task.groupBy({
      by: ['status'],
      _count: true
    });

    console.log(chalk.bold('\n📊 AgentOS Status\n'));

    console.log(chalk.bold('Agents:'));
    for (const a of agents) {
      const statusIcon = a.status === 'online' ? '🟢' : a.status === 'busy' ? '🟡' : '⚫';
      console.log(`  ${statusIcon} ${a.name} (${a.role})`);
    }

    console.log(chalk.bold('\nTasks:'));
    for (const t of tasks) {
      console.log(`  ${t.status}: ${t._count}`);
    }

    await prisma.$disconnect();
  });

program.parse();
```

### Add to package.json
```json
{
  "bin": {
    "agentos": "./dist/cli/index.js"
  },
  "scripts": {
    "cli": "ts-node src/cli/index.ts"
  }
}
```

## ✅ Acceptance Criteria
- [ ] `agentos task create --title "..."` creates task
- [ ] `agentos task list` shows all tasks
- [ ] `agentos task list --status inbox` filters by status
- [ ] `agentos task show --id <id>` shows task details
- [ ] `agentos agent list` shows all agents
- [ ] `agentos status` shows system overview
- [ ] Color-coded output
- [ ] TypeScript compiles without errors

## 📁 Files to Create/Modify
- CREATE: `src/cli/index.ts`
- MODIFY: `package.json` (add bin, cli script, dependencies)

## 🧪 Verification
```bash
npm install commander chalk
npm run build
npm run cli status
npm run cli task create --title "Test task"
npm run cli task list
```

## ⏱️ Estimated Time
2-3 hours

## 🏷️ Labels
`cli`, `independent`, `parallel-safe`
