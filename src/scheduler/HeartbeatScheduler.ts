import { PrismaClient, Agent } from '@prisma/client';
import { BaseAgent, Tool } from '../agents/BaseAgent';
import { OrchestratorAgent } from '../agents/OrchestratorAgent';
import { WorkerAgent } from '../agents/WorkerAgent';
import { ReviewerAgent } from '../agents/ReviewerAgent';

/**
 * Default heartbeat intervals by agent role (in milliseconds)
 */
const DEFAULT_INTERVALS: Record<string, number> = {
  orchestrator: 5 * 60 * 1000, // 5 minutes
  worker: 2 * 60 * 1000, // 2 minutes
  reviewer: 5 * 60 * 1000, // 5 minutes
};

/**
 * Configuration for overriding default intervals
 */
interface SchedulerConfig {
  intervals?: Record<string, number>;
  tools?: Tool[];
}

/**
 * HeartbeatScheduler - Manages the pulse of the agent system
 * 
 * Responsibilities:
 * - Load agents from database
 * - Create appropriate agent instances
 * - Schedule heartbeats at role-specific intervals
 * - Handle graceful start/stop
 */
export class HeartbeatScheduler {
  private prisma: PrismaClient;
  private agents: Map<string, BaseAgent> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private running = false;
  private config: SchedulerConfig;
  private tools: Tool[] = [];

  constructor(prisma: PrismaClient, config: SchedulerConfig = {}) {
    this.prisma = prisma;
    this.config = config;
    this.tools = config.tools || [];
  }

  /**
   * Register a tool that will be available to all agents
   * @param tool - The tool to register
   */
  registerTool(tool: Tool): void {
    this.tools.push(tool);
    // Register with existing agents
    for (const agent of this.agents.values()) {
      agent.registerTool(tool);
    }
  }

  /**
   * Initialize the scheduler by loading agents from the database
   */
  async initialize(): Promise<void> {
    // Load all agents from database
    const agentRecords = await this.prisma.agent.findMany();

    for (const record of agentRecords) {
      const agent = this.createAgent(record);
      if (agent) {
        // Register all tools with the agent
        for (const tool of this.tools) {
          agent.registerTool(tool);
        }
        this.agents.set(record.id, agent);
      }
    }

    console.log(`[Scheduler] Initialized ${this.agents.size} agents:`);
    for (const [id, agent] of this.agents) {
      const record = (agent as any).agentRecord as Agent;
      console.log(`  - ${record.name} (${record.role})`);
    }
  }

  /**
   * Create an agent instance based on the database record
   * @param record - The agent database record
   * @returns The appropriate agent instance or null
   */
  private createAgent(record: Agent): BaseAgent | null {
    switch (record.role) {
      case 'orchestrator':
        return new OrchestratorAgent(this.prisma, record);
      case 'worker':
        return new WorkerAgent(this.prisma, record);
      case 'reviewer':
        return new ReviewerAgent(this.prisma, record);
      default:
        console.warn(`[Scheduler] Unknown agent role: ${record.role}`);
        return null;
    }
  }

  /**
   * Start all agent heartbeat timers
   */
  start(): void {
    if (this.running) {
      console.warn('[Scheduler] Already running');
      return;
    }
    this.running = true;

    for (const [id, agent] of this.agents) {
      const record = (agent as any).agentRecord as Agent;
      const role = record.role;
      const interval =
        this.config.intervals?.[role] || DEFAULT_INTERVALS[role] || DEFAULT_INTERVALS.worker;

      // Run immediately on start
      this.runHeartbeat(id, agent, record);

      // Then schedule recurring heartbeats
      const timer = setInterval(() => {
        this.runHeartbeat(id, agent, record);
      }, interval);

      this.timers.set(id, timer);
      console.log(`[Scheduler] Scheduled ${record.name} (${role}) every ${interval / 1000}s`);
    }

    console.log('[Scheduler] All agents scheduled and running');
  }

  /**
   * Stop all agent heartbeat timers
   */
  stop(): void {
    if (!this.running) {
      console.warn('[Scheduler] Not running');
      return;
    }

    this.running = false;

    for (const [id, timer] of this.timers) {
      clearInterval(timer);
    }
    this.timers.clear();

    console.log('[Scheduler] Stopped all heartbeat timers');
  }

  /**
   * Execute a single heartbeat for an agent
   * @param id - The agent ID
   * @param agent - The agent instance
   * @param record - The agent database record
   */
  private async runHeartbeat(id: string, agent: BaseAgent, record: Agent): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Heartbeat: ${record.name} (${record.role})`);

    try {
      await agent.heartbeat();
      console.log(`[${timestamp}] Heartbeat complete: ${record.name}`);
    } catch (error) {
      console.error(`[${timestamp}] Heartbeat FAILED for ${record.name}:`, error);
      // Log error to database
      try {
        await this.prisma.activity.create({
          data: {
            eventType: 'heartbeat_error',
            agentId: id,
            message: `Heartbeat failed: ${error}`,
            metadata: { error: String(error) },
          },
        });
      } catch {
        // Ignore logging errors
      }
    }
  }

  /**
   * Get status of all agents
   * @returns Array of agent status objects
   */
  async getStatus(): Promise<
    Array<{
      id: string;
      name: string;
      role: string;
      status: string;
      lastHeartbeat: Date | null;
    }>
  > {
    const agents = await this.prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        lastHeartbeat: true,
      },
    });
    return agents;
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get count of active agents
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * Manually trigger a heartbeat for a specific agent
   * @param agentId - The agent ID to trigger
   */
  async triggerHeartbeat(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const record = (agent as any).agentRecord as Agent;
    await this.runHeartbeat(agentId, agent, record);
  }
}
