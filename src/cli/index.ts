#!/usr/bin/env node
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

// ============================================================================
// Task Commands
// ============================================================================
const taskCmd = program.command('task').description('Manage tasks');

taskCmd
  .command('create')
  .description('Create a new task')
  .requiredOption('-t, --title <title>', 'Task title')
  .option('-d, --desc <description>', 'Task description')
  .option('-p, --priority <priority>', 'Priority (0-10)', '0')
  .action(async (options) => {
    try {
      const task = await prisma.task.create({
        data: {
          title: options.title,
          description: options.desc || '',
          priority: parseInt(options.priority),
          status: 'inbox',
        },
      });
      console.log(chalk.green(`✓ Created task: ${task.id}`));
      console.log(`  Title: ${task.title}`);
      console.log(`  Status: ${task.status}`);
      console.log(`  Priority: ${task.priority}`);
    } catch (error) {
      console.error(chalk.red('Error creating task:'), error);
    } finally {
      await prisma.$disconnect();
    }
  });

taskCmd
  .command('list')
  .description('List tasks')
  .option(
    '-s, --status <status>',
    'Filter by status (inbox, assigned, in_progress, review, done, blocked)',
  )
  .option('-l, --limit <limit>', 'Number of tasks to show', '20')
  .action(async (options) => {
    try {
      const where: Record<string, unknown> = {};
      if (options.status) where.status = options.status;

      const tasks = await prisma.task.findMany({
        where,
        orderBy: { priority: 'desc' },
        take: parseInt(options.limit),
        include: { assignee: true },
      });

      if (tasks.length === 0) {
        console.log(chalk.yellow('No tasks found.'));
        return;
      }

      console.log(chalk.bold('\n📋 Tasks:\n'));

      const statusColors: Record<string, (s: string) => string> = {
        inbox: chalk.gray,
        assigned: chalk.blue,
        in_progress: chalk.yellow,
        review: chalk.magenta,
        done: chalk.green,
        blocked: chalk.red,
        cancelled: chalk.gray,
      };

      for (const t of tasks) {
        const colorFn = statusColors[t.status] || chalk.white;
        const assignee = t.assignee ? chalk.cyan(` → ${t.assignee.name}`) : '';
        console.log(
          `  ${colorFn(`[${t.status.padEnd(11)}]`)} ${t.title.substring(0, 50)}${assignee}`,
        );
        console.log(chalk.gray(`    ID: ${t.id}`));
      }
      console.log();
    } catch (error) {
      console.error(chalk.red('Error listing tasks:'), error);
    } finally {
      await prisma.$disconnect();
    }
  });

taskCmd
  .command('show <id>')
  .description('Show task details')
  .action(async (id) => {
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          assignee: true,
          createdBy: true,
          subtasks: true,
          messages: { orderBy: { createdAt: 'asc' }, take: 10 },
        },
      });

      if (!task) {
        console.error(chalk.red('Task not found'));
        process.exit(1);
      }

      console.log(chalk.bold(`\n📋 Task: ${task.title}\n`));
      console.log(`  ID:          ${task.id}`);
      console.log(`  Status:      ${task.status}`);
      console.log(`  Priority:    ${task.priority}`);
      console.log(`  Description: ${task.description || 'None'}`);
      console.log(`  Branch:      ${task.branchName || 'None'}`);
      console.log(`  Assignee:    ${task.assignee?.name || 'Unassigned'}`);
      console.log(`  Created By:  ${task.createdBy?.name || 'Unknown'}`);
      console.log(`  Created:     ${task.createdAt.toISOString()}`);

      if (task.subtasks.length > 0) {
        console.log(chalk.bold('\n  Subtasks:'));
        for (const sub of task.subtasks) {
          console.log(`    - [${sub.status}] ${sub.title}`);
        }
      }

      if (task.messages.length > 0) {
        console.log(chalk.bold('\n  Messages:'));
        for (const msg of task.messages) {
          console.log(
            chalk.gray(
              `    ${msg.createdAt.toLocaleTimeString()}: ${msg.content.substring(0, 60)}`,
            ),
          );
        }
      }
      console.log();
    } catch (error) {
      console.error(chalk.red('Error showing task:'), error);
    } finally {
      await prisma.$disconnect();
    }
  });

taskCmd
  .command('update <id>')
  .description('Update a task')
  .option('-s, --status <status>', 'New status')
  .option('-t, --title <title>', 'New title')
  .option('-p, --priority <priority>', 'New priority')
  .action(async (id, options) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (options.status) updateData.status = options.status;
      if (options.title) updateData.title = options.title;
      if (options.priority) updateData.priority = parseInt(options.priority);

      if (Object.keys(updateData).length === 0) {
        console.error(chalk.yellow('No updates provided. Use --status, --title, or --priority'));
        return;
      }

      const task = await prisma.task.update({
        where: { id },
        data: updateData,
      });

      console.log(chalk.green('✓ Task updated'));
      console.log(`  Title: ${task.title}`);
      console.log(`  Status: ${task.status}`);
    } catch (error) {
      console.error(chalk.red('Error updating task:'), error);
    } finally {
      await prisma.$disconnect();
    }
  });

// ============================================================================
// Agent Commands
// ============================================================================
const agentCmd = program.command('agent').description('View and manage agents');

agentCmd
  .command('list')
  .description('List all agents')
  .action(async () => {
    try {
      const agents = await prisma.agent.findMany({
        include: {
          tasksAssigned: {
            where: { status: { in: ['assigned', 'in_progress'] } },
          },
        },
      });

      console.log(chalk.bold('\n🤖 Agents:\n'));

      for (const a of agents) {
        const statusIcon =
          a.status === 'online' || a.status === 'idle' ? '🟢' : a.status === 'busy' ? '🟡' : '⚫';
        const taskCount = a.tasksAssigned.length;
        console.log(`  ${statusIcon} ${chalk.bold(a.name)} (${a.role})`);
        console.log(chalk.gray(`     Status: ${a.status} | Tasks: ${taskCount}`));
        console.log(chalk.gray(`     ID: ${a.id}`));
      }
      console.log();
    } catch (error) {
      console.error(chalk.red('Error listing agents:'), error);
    } finally {
      await prisma.$disconnect();
    }
  });

agentCmd
  .command('show <id>')
  .description('Show agent details')
  .action(async (id) => {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id },
        include: {
          tasksAssigned: { orderBy: { createdAt: 'desc' }, take: 5 },
          activities: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });

      if (!agent) {
        console.error(chalk.red('Agent not found'));
        process.exit(1);
      }

      console.log(chalk.bold(`\n🤖 Agent: ${agent.name}\n`));
      console.log(`  ID:            ${agent.id}`);
      console.log(`  Role:          ${agent.role}`);
      console.log(`  Status:        ${agent.status}`);
      console.log(`  Last Heartbeat: ${agent.lastHeartbeat?.toISOString() || 'Never'}`);

      if (agent.tasksAssigned.length > 0) {
        console.log(chalk.bold('\n  Recent Tasks:'));
        for (const t of agent.tasksAssigned) {
          console.log(`    - [${t.status}] ${t.title.substring(0, 50)}`);
        }
      }

      if (agent.activities.length > 0) {
        console.log(chalk.bold('\n  Recent Activity:'));
        for (const a of agent.activities) {
          console.log(
            chalk.gray(
              `    ${a.createdAt.toLocaleTimeString()}: [${a.eventType}] ${a.message?.substring(0, 50) || ''}`,
            ),
          );
        }
      }
      console.log();
    } catch (error) {
      console.error(chalk.red('Error showing agent:'), error);
    } finally {
      await prisma.$disconnect();
    }
  });

// ============================================================================
// Status Command
// ============================================================================
program
  .command('status')
  .description('Show system status overview')
  .action(async () => {
    try {
      const agents = await prisma.agent.findMany();
      const taskStats = await prisma.task.groupBy({
        by: ['status'],
        _count: true,
      });
      const recentActivity = await prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { agent: true },
      });

      console.log(chalk.bold('\n📊 AgentOS Status\n'));

      // Agents
      console.log(chalk.bold('🤖 Agents:'));
      for (const a of agents) {
        const statusIcon =
          a.status === 'online' || a.status === 'idle' ? '🟢' : a.status === 'busy' ? '🟡' : '⚫';
        console.log(`  ${statusIcon} ${a.name} (${a.role}) - ${a.status}`);
      }

      // Tasks
      console.log(chalk.bold('\n📋 Tasks:'));
      const statusOrder = ['inbox', 'assigned', 'in_progress', 'review', 'done', 'blocked'];
      const taskMap = taskStats.reduce(
        (acc, t) => {
          acc[t.status] = t._count;
          return acc;
        },
        {} as Record<string, number>,
      );

      for (const status of statusOrder) {
        const count = taskMap[status] || 0;
        if (count > 0) {
          console.log(`  ${status.padEnd(12)}: ${count}`);
        }
      }

      // Recent Activity
      if (recentActivity.length > 0) {
        console.log(chalk.bold('\n📜 Recent Activity:'));
        for (const a of recentActivity) {
          const time = a.createdAt.toLocaleTimeString();
          const agent = a.agent?.name || 'System';
          console.log(
            chalk.gray(`  ${time} [${agent}] ${a.eventType}: ${a.message?.substring(0, 40) || ''}`),
          );
        }
      }

      console.log();
    } catch (error) {
      console.error(chalk.red('Error getting status:'), error);
    } finally {
      await prisma.$disconnect();
    }
  });

// ============================================================================
// Activity Command
// ============================================================================
program
  .command('activity')
  .description('Show recent activity log')
  .option('-l, --limit <limit>', 'Number of entries', '20')
  .action(async (options) => {
    try {
      const activities = await prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: parseInt(options.limit),
        include: { agent: true, task: true },
      });

      console.log(chalk.bold('\n📜 Activity Log:\n'));

      for (const a of activities) {
        const time = a.createdAt.toLocaleString();
        const agent = a.agent?.name || 'System';
        const task = a.task ? chalk.cyan(`[${a.task.title.substring(0, 20)}]`) : '';
        console.log(`  ${chalk.gray(time)} ${chalk.blue(agent)} ${task}`);
        console.log(`    ${a.eventType}: ${a.message || ''}`);
      }
      console.log();
    } catch (error) {
      console.error(chalk.red('Error getting activity:'), error);
    } finally {
      await prisma.$disconnect();
    }
  });

// Parse and run
program.parse();
