import dotenv from 'dotenv';
import { PrismaClient, Agent } from '@prisma/client';
import { EventBus, AgentEvent } from './events';
import { OrchestratorAgent } from './agents/OrchestratorAgent';
import { WorkerAgent } from './agents/WorkerAgent';
import { ReviewerAgent } from './agents/ReviewerAgent';
import { Tool } from './agents/BaseAgent';
import { FileSystemTool, ShellTool, GitTool, createDatabaseTool, WebSearchTool } from './tools';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Event-Driven AgentOS Kernel
 *
 * Instead of polling, this kernel reacts to events:
 * - Task created → Orchestrator breaks it down immediately
 * - Task assigned → Worker starts immediately
 * - Task completed → Reviewer reviews immediately
 * - Agent idle → Assigns next task immediately
 */
class EventDrivenKernel {
  private eventBus: EventBus;
  private agents: Map<string, OrchestratorAgent | WorkerAgent | ReviewerAgent> = new Map();
  private agentRecords: Map<string, Agent> = new Map();
  private tools: Tool[] = [];
  private isRunning = false;

  constructor() {
    this.eventBus = EventBus.getInstance(prisma);
    this.tools = [FileSystemTool, ShellTool, GitTool, createDatabaseTool(prisma), WebSearchTool];
  }

  /**
   * Initialize agents and event handlers
   */
  async initialize(): Promise<void> {
    console.log('[Kernel] Initializing event-driven kernel...');

    // Load agents from database
    const agentRecords = await prisma.agent.findMany();

    for (const record of agentRecords) {
      this.agentRecords.set(record.id, record);

      let agent: OrchestratorAgent | WorkerAgent | ReviewerAgent;

      switch (record.role) {
        case 'orchestrator':
          agent = new OrchestratorAgent(prisma, record);
          break;
        case 'worker':
          agent = new WorkerAgent(prisma, record);
          break;
        case 'reviewer':
          agent = new ReviewerAgent(prisma, record);
          break;
        default:
          console.warn(`[Kernel] Unknown role: ${record.role}`);
          continue;
      }

      // Register tools
      for (const tool of this.tools) {
        agent.registerTool(tool);
      }

      this.agents.set(record.id, agent);
      console.log(`[Kernel] Loaded ${record.name} (${record.role})`);
    }

    // Set up event handlers
    this.setupEventHandlers();

    console.log(
      `[Kernel] Initialized with ${this.agents.size} agents and ${this.tools.length} tools`,
    );
  }

  /**
   * Set up event handlers for reactive processing
   */
  private setupEventHandlers(): void {
    // When a task is created → Orchestrator processes it
    this.eventBus.subscribe('task:created', async (event) => {
      if (event.type !== 'task:created') return;
      console.log(`[Kernel] Task created: ${event.task.title}`);

      const orchestrator = this.getAgentByRole('orchestrator');
      if (orchestrator) {
        await (orchestrator as OrchestratorAgent).processNewGoal(event.task);
      }
    });

    // When a task is assigned → Worker starts immediately
    this.eventBus.subscribe('task:assigned', async (event) => {
      if (event.type !== 'task:assigned') return;
      console.log(`[Kernel] Task assigned: ${event.task.title} to agent ${event.agentId}`);

      const worker = this.agents.get(event.agentId) as WorkerAgent;
      if (worker) {
        console.log(`[Kernel] Worker found, starting task processing...`);
        try {
          await worker.processTask(event.task);
          console.log(`[Kernel] Task completed: ${event.task.title}`);
        } catch (error) {
          console.error(`[Kernel] Error processing task:`, error);
        }
      } else {
        console.warn(`[Kernel] No worker found for agentId: ${event.agentId}`);
        console.log(`[Kernel] Available agents: ${Array.from(this.agents.keys()).join(', ')}`);
      }
    });

    // When a task needs review → Reviewer processes immediately
    this.eventBus.subscribe('task:review_needed', async (event) => {
      if (event.type !== 'task:review_needed') return;
      console.log(`[Kernel] Task ready for review: ${event.task.title}`);

      const reviewer = this.getAgentByRole('reviewer');
      if (reviewer) {
        await (reviewer as ReviewerAgent).reviewTask(event.task);
      }
    });

    // When agent becomes idle → Assign next task
    this.eventBus.subscribe('agent:idle', async (event) => {
      if (event.type !== 'agent:idle') return;

      const agent = this.agents.get(event.agentId);
      const record = this.agentRecords.get(event.agentId);

      if (!agent || !record) return;

      if (record.role === 'worker') {
        await this.assignNextTask(event.agentId);
      }
    });
  }

  /**
   * Get agent by role
   */
  private getAgentByRole(
    role: string,
  ): OrchestratorAgent | WorkerAgent | ReviewerAgent | undefined {
    for (const [id, agent] of this.agents) {
      const record = this.agentRecords.get(id);
      if (record?.role === role) return agent;
    }
    return undefined;
  }

  /**
   * Assign next available task to a worker
   */
  private async assignNextTask(workerId: string): Promise<void> {
    const nextTask = await prisma.task.findFirst({
      where: { status: 'inbox', parentTaskId: { not: null } }, // Only subtasks
      orderBy: { priority: 'desc' },
    });

    if (nextTask) {
      await prisma.task.update({
        where: { id: nextTask.id },
        data: { status: 'assigned', assigneeId: workerId },
      });

      this.eventBus.dispatch({
        type: 'task:assigned',
        task: nextTask,
        agentId: workerId,
      });
    }
  }

  /**
   * Start the kernel - process existing tasks and listen for new ones
   */
  async start(): Promise<void> {
    this.isRunning = true;

    // Process any existing inbox goals (parent tasks)
    const inboxGoals = await prisma.task.findMany({
      where: { status: 'inbox', parentTaskId: null },
    });

    console.log(`[Kernel] Found ${inboxGoals.length} inbox goals to process`);

    for (const goal of inboxGoals) {
      this.eventBus.dispatch({ type: 'task:created', task: goal });
    }

    // Process any in_progress tasks that have assignees
    const inProgressTasks = await prisma.task.findMany({
      where: { status: 'in_progress', assigneeId: { not: null } },
      include: { assignee: true },
    });

    console.log(`[Kernel] Found ${inProgressTasks.length} in-progress tasks to continue`);

    for (const task of inProgressTasks) {
      if (task.assigneeId) {
        this.eventBus.dispatch({
          type: 'task:assigned',
          task,
          agentId: task.assigneeId,
        });
      }
    }

    // Process any assigned tasks
    const assignedTasks = await prisma.task.findMany({
      where: { status: 'assigned' },
      include: { assignee: true },
    });

    console.log(`[Kernel] Found ${assignedTasks.length} assigned tasks to continue`);

    for (const task of assignedTasks) {
      if (task.assigneeId) {
        this.eventBus.dispatch({
          type: 'task:assigned',
          task,
          agentId: task.assigneeId,
        });
      }
    }

    // Process any tasks in review
    const reviewTasks = await prisma.task.findMany({
      where: { status: 'review' },
    });

    console.log(`[Kernel] Found ${reviewTasks.length} tasks awaiting review`);

    for (const task of reviewTasks) {
      this.eventBus.dispatch({ type: 'task:review_needed', task });
    }

    console.log('[Kernel] Event-driven kernel started');
  }

  /**
   * Stop the kernel
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('[Kernel] Stopping...');

    await prisma.agent.updateMany({
      data: { status: 'offline' },
    });

    await prisma.$disconnect();
    console.log('[Kernel] Stopped');
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              🚀 AgentOS Event-Driven Kernel v0.2.0            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('⚠️  DEEPSEEK_API_KEY not set - LLM calls will fail');
  }

  const kernel = new EventDrivenKernel();

  try {
    await kernel.initialize();
    await kernel.start();

    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║               ✅ Kernel running in event-driven mode          ║');
    console.log('║                                                               ║');
    console.log('║   Tasks are processed immediately when created/updated        ║');
    console.log('║   No polling - pure event-driven execution                    ║');
    console.log('║                                                               ║');
    console.log('║   Press Ctrl+C to stop                                        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Handle shutdown
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n[Kernel] Received ${signal}`);
      await kernel.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Keep alive
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
