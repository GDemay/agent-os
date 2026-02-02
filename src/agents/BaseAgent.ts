import { PrismaClient, Agent, Task } from '@prisma/client';
import { LLMFactory, LLMProvider, LLMMessage, LLMResponse } from '../lib/llm';

/**
 * Tool interface for agent capabilities
 * Each tool has a name, description, parameters schema, and execution function
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Configuration for agent initialization
 */
export interface AgentConfig {
  id: string;
  systemPrompt: string;
  modelConfig: {
    provider: string;
    model: string;
    temperature: number;
  };
}

/**
 * Abstract BaseAgent class that all agents (Orchestrator, Worker, Reviewer) will extend.
 * Provides the core "loop" of an agent: wake up → think → act → sleep.
 */
export abstract class BaseAgent {
  protected prisma: PrismaClient;
  protected llm: LLMProvider;
  protected agentRecord: Agent;
  protected tools: Map<string, Tool> = new Map();

  /**
   * Creates a new BaseAgent instance
   * @param prisma - PrismaClient instance for database operations
   * @param agentRecord - The Agent database record
   */
  constructor(prisma: PrismaClient, agentRecord: Agent) {
    this.prisma = prisma;
    this.agentRecord = agentRecord;
    const config = agentRecord.modelConfig as AgentConfig['modelConfig'];
    this.llm = LLMFactory.create(config.provider);
  }

  /**
   * Registers a tool that the agent can use
   * @param tool - The Tool to register
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Gets a formatted string of all registered tool definitions
   * @returns String containing tool names and descriptions
   */
  getToolDefinitions(): string {
    return Array.from(this.tools.values())
      .map((t) => `- ${t.name}: ${t.description}`)
      .join('\n');
  }

  /**
   * Abstract heartbeat method that must be implemented by subclasses.
   * This is the main entry point for agent activity.
   */
  abstract heartbeat(): Promise<void>;

  /**
   * Updates the agent's status in the database
   * @param status - The new status ('online' | 'offline' | 'busy' | 'idle')
   */
  async updateStatus(status: 'online' | 'offline' | 'busy' | 'idle'): Promise<void> {
    await this.prisma.agent.update({
      where: { id: this.agentRecord.id },
      data: { status, lastHeartbeat: new Date() },
    });
  }

  /**
   * Logs an activity event to the database
   * @param eventType - The type of event
   * @param message - The message to log
   * @param taskId - Optional associated task ID
   */
  async logActivity(eventType: string, message: string, taskId?: string): Promise<void> {
    await this.prisma.activity.create({
      data: {
        eventType,
        agentId: this.agentRecord.id,
        taskId,
        message,
        metadata: {},
      },
    });
  }

  /**
   * Sends a message to another agent
   * @param content - The message content
   * @param toAgentId - Optional recipient agent ID
   * @param taskId - Optional associated task ID
   */
  async sendMessage(content: string, toAgentId?: string, taskId?: string): Promise<void> {
    await this.prisma.message.create({
      data: {
        content,
        fromAgentId: this.agentRecord.id,
        toAgentId,
        taskId,
        messageType: 'comment',
      },
    });
  }

  /**
   * Think method - calls the LLM with the agent's system prompt
   * @param userPrompt - The user prompt to send to the LLM
   * @returns The LLM response
   */
  protected async think(userPrompt: string): Promise<LLMResponse> {
    const messages: LLMMessage[] = [
      { role: 'system', content: this.agentRecord.systemPrompt || '' },
      { role: 'user', content: userPrompt },
    ];
    const config = this.agentRecord.modelConfig as AgentConfig['modelConfig'];
    return this.llm.generate(messages, {
      model: config.model,
      temperature: config.temperature,
    });
  }
}
