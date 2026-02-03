import { PrismaClient, Agent, Task } from '@prisma/client';
import { BaseAgent } from './BaseAgent';

/**
 * OrchestratorAgent - The system's brain
 *
 * Responsibilities:
 * - Break down high-level goals into actionable tasks
 * - Monitor system health and worker progress
 * - Assign tasks to idle workers
 * - Handle blocked tasks
 */
export class OrchestratorAgent extends BaseAgent {
  constructor(prisma: PrismaClient, agentRecord: Agent) {
    super(prisma, agentRecord);
  }

  /**
   * Process a new goal immediately (event-driven)
   * @param goal - The goal task to process
   */
  async processNewGoal(goal: Task): Promise<void> {
    await this.updateStatus('busy');
    await this.logActivity('planning', `Processing new goal: ${goal.title}`, goal.id);

    try {
      await this.breakdownGoal(goal);
      await this.assignTasks();
    } catch (error) {
      await this.logActivity('error', `Goal processing error: ${error}`, goal.id);
    }

    await this.updateStatus('idle');
  }

  /**
   * Heartbeat implementation for Orchestrator
   * Runs every 5 minutes to:
   * 1. Check for new goals (inbox tasks without parent)
   * 2. Break down goals into subtasks
   * 3. Handle blocked tasks
   * 4. Assign tasks to idle workers
   */
  async heartbeat(): Promise<void> {
    await this.updateStatus('busy');
    await this.logActivity('heartbeat', 'Orchestrator heartbeat started');

    try {
      // 1. Check for new goals (tasks with status 'inbox' and no parent)
      const newGoals = await this.prisma.task.findMany({
        where: { status: 'inbox', parentTaskId: null },
      });

      // 2. For each goal, break down into subtasks
      for (const goal of newGoals) {
        await this.breakdownGoal(goal);
      }

      // 3. Check for blocked tasks
      const blockedTasks = await this.prisma.task.findMany({
        where: { status: 'blocked' },
      });
      for (const task of blockedTasks) {
        await this.handleBlockedTask(task);
      }

      // 4. Check for idle workers and assign tasks
      await this.assignTasks();
    } catch (error) {
      await this.logActivity('error', `Heartbeat error: ${error}`);
    }

    await this.updateStatus('idle');
    await this.logActivity('heartbeat', 'Orchestrator heartbeat complete');
  }

  /**
   * Breaks down a high-level goal into actionable subtasks using the LLM
   * @param goal - The goal task to break down
   */
  private async breakdownGoal(goal: Task): Promise<void> {
    await this.logActivity('planning', `Breaking down goal: ${goal.title}`, goal.id);

    const prompt = `
You are breaking down a goal into actionable tasks.

GOAL:
Title: ${goal.title}
Description: ${goal.description || 'No description provided'}

Break this into 3-7 atomic, actionable tasks. Each task should:
- Be completable by a single developer in 1-4 hours
- Have a clear deliverable
- Be independent when possible

IMPORTANT: Respond ONLY with valid JSON, no additional text:
{
  "tasks": [
    { "title": "Task title", "description": "What to do", "priority": 1 }
  ]
}
`;

    const response = await this.think(prompt);

    try {
      // Extract JSON from response (handle potential markdown code blocks)
      let jsonContent = response.content;
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);

      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error('Invalid response format: missing tasks array');
      }

      // Create subtasks
      for (const task of parsed.tasks) {
        await this.prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            priority: task.priority || 0,
            parentTaskId: goal.id,
            createdById: this.agentRecord.id,
            status: 'inbox',
          },
        });
      }

      // Update goal status to in_progress
      await this.prisma.task.update({
        where: { id: goal.id },
        data: { status: 'in_progress' },
      });

      await this.logActivity(
        'planning',
        `Created ${parsed.tasks.length} subtasks for goal: ${goal.title}`,
        goal.id,
      );
    } catch (e) {
      await this.logActivity('error', `Failed to parse breakdown: ${e}`, goal.id);
      // Mark goal as blocked if we can't parse the response
      await this.prisma.task.update({
        where: { id: goal.id },
        data: { status: 'blocked', error: `Planning failed: ${e}` },
      });
    }
  }

  /**
   * Handles a blocked task by logging and attempting resolution
   * @param task - The blocked task
   */
  async handleBlockedTask(task: Task): Promise<void> {
    await this.logActivity('review', `Reviewing blocked task: ${task.title}`, task.id);

    // Get the error reason if available
    const errorReason = task.error || 'Unknown blocker';

    const prompt = `
A task is blocked. Analyze and suggest a resolution.

TASK:
Title: ${task.title}
Description: ${task.description || 'No description'}
Error: ${errorReason}

What should we do? Options:
1. "retry" - Clear the blocker and retry the task
2. "escalate" - Needs human intervention
3. "cancel" - The task cannot be completed

Respond with JSON:
{
  "action": "retry" | "escalate" | "cancel",
  "reasoning": "why this action"
}
`;

    const response = await this.think(prompt);

    try {
      let jsonContent = response.content;
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);

      switch (parsed.action) {
        case 'retry':
          await this.prisma.task.update({
            where: { id: task.id },
            data: { status: 'inbox', error: null },
          });
          await this.logActivity('resolution', `Retrying blocked task: ${task.title}`, task.id);
          break;
        case 'cancel':
          await this.prisma.task.update({
            where: { id: task.id },
            data: { status: 'cancelled' },
          });
          await this.logActivity('resolution', `Cancelled blocked task: ${task.title}`, task.id);
          break;
        case 'escalate':
        default:
          await this.sendMessage(
            `⚠️ ESCALATION: Task "${task.title}" needs human intervention. Reason: ${parsed.reasoning}`,
            undefined,
            task.id,
          );
          await this.logActivity('escalation', `Escalated blocked task: ${task.title}`, task.id);
          break;
      }
    } catch (e) {
      await this.logActivity('error', `Failed to handle blocked task: ${e}`, task.id);
    }
  }

  /**
   * Assigns unassigned tasks to idle workers
   */
  private async assignTasks(): Promise<void> {
    // Find idle workers
    const idleWorkers = await this.prisma.agent.findMany({
      where: { role: 'worker', status: 'idle' },
    });

    if (idleWorkers.length === 0) {
      return; // No idle workers available
    }

    // Find unassigned tasks (prioritized, leaf tasks only - no parent goals)
    const unassignedTasks = await this.prisma.task.findMany({
      where: {
        status: 'inbox',
        assigneeId: null,
        // Only assign leaf tasks (tasks that have a parent or standalone atomic tasks)
        OR: [
          { parentTaskId: { not: null } }, // Subtasks
          {
            parentTaskId: null,
            subtasks: { none: {} }, // Standalone tasks with no subtasks
          },
        ],
      },
      orderBy: { priority: 'desc' },
      take: idleWorkers.length,
    });

    // Assign tasks to workers
    for (let i = 0; i < Math.min(idleWorkers.length, unassignedTasks.length); i++) {
      const task = unassignedTasks[i];
      const worker = idleWorkers[i];

      await this.prisma.task.update({
        where: { id: task.id },
        data: { assigneeId: worker.id, status: 'assigned' },
      });

      await this.sendMessage(
        `📋 Assigned task: ${task.title}\n\nDescription: ${task.description || 'No description'}`,
        worker.id,
        task.id,
      );

      await this.logActivity(
        'assignment',
        `Assigned "${task.title}" to worker ${worker.name}`,
        task.id,
      );
    }

    if (unassignedTasks.length > 0) {
      await this.logActivity(
        'assignment',
        `Assigned ${Math.min(idleWorkers.length, unassignedTasks.length)} tasks to workers`,
      );
    }
  }
}
