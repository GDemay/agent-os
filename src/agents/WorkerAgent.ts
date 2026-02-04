import { PrismaClient, Agent, Task } from '@prisma/client';
import { BaseAgent } from './BaseAgent';
import { EventBus } from '../events';

/**
 * WorkerAgent - The system's builder
 *
 * Responsibilities:
 * - Execute assigned tasks
 * - Use tools to write code, run commands
 * - Update task status on completion/blocking
 * - Iterate until task is done
 */
export class WorkerAgent extends BaseAgent {
  private currentTask: Task | null = null;
  private maxIterations = 10; // Prevent infinite loops

  constructor(prisma: PrismaClient, agentRecord: Agent) {
    super(prisma, agentRecord);
  }

  /**
   * Process a task immediately (event-driven)
   * @param task - The task to process
   */
  async processTask(task: Task): Promise<void> {
    await this.updateStatus('busy');
    this.currentTask = task;

    try {
      if (task.status === 'assigned') {
        await this.executeTask(task);
      } else if (task.status === 'in_progress') {
        await this.continueTask(task);
      }
    } catch (error) {
      await this.logActivity('error', `Task processing error: ${error}`, task.id);
    }

    await this.updateStatus('idle');
  }

  /**
   * Heartbeat implementation for Worker
   * Runs every 2 minutes to:
   * 1. Check for assigned tasks
   * 2. Execute or continue work
   * 3. Report progress
   */
  async heartbeat(): Promise<void> {
    await this.updateStatus('busy');

    try {
      // 1. Check for assigned tasks
      const assignedTask = await this.prisma.task.findFirst({
        where: { assigneeId: this.agentRecord.id, status: 'assigned' },
      });

      if (assignedTask) {
        this.currentTask = assignedTask;
        await this.executeTask(assignedTask);
        return;
      }

      // 2. Check for in_progress tasks
      const inProgressTask = await this.prisma.task.findFirst({
        where: { assigneeId: this.agentRecord.id, status: 'in_progress' },
      });

      if (inProgressTask) {
        this.currentTask = inProgressTask;
        await this.continueTask(inProgressTask);
        return;
      }

      // No tasks - stay idle
      await this.logActivity('idle', 'No tasks assigned, staying idle');
    } catch (error) {
      await this.logActivity('error', `Heartbeat error: ${error}`);
    } finally {
      await this.updateStatus('idle');
    }
  }

  /**
   * Start executing a newly assigned task
   * @param task - The task to execute
   */
  private async executeTask(task: Task): Promise<void> {
    await this.logActivity('task_start', `Starting task: ${task.title}`, task.id);

    // Update status to in_progress
    await this.prisma.task.update({
      where: { id: task.id },
      data: { status: 'in_progress', startedAt: new Date() },
    });

    // Create branch name for the task
    const branchName = `feature/task-${task.id.slice(0, 8)}`;
    await this.prisma.task.update({
      where: { id: task.id },
      data: { branchName },
    });

    // Create git branch using git tool
    const gitTool = this.tools.get('git');
    if (gitTool) {
      try {
        // Create and checkout feature branch
        await gitTool.execute({ action: 'branch', branch: branchName });
        await gitTool.execute({ action: 'checkout', branch: branchName });
        await this.logActivity('git', `Created and checked out branch: ${branchName}`, task.id);
      } catch (error) {
        // Branch may already exist, try checkout only
        try {
          await gitTool.execute({ action: 'checkout', branch: branchName });
          await this.logActivity('git', `Checked out existing branch: ${branchName}`, task.id);
        } catch (checkoutError) {
          await this.logActivity('warning', `Git branch setup failed: ${checkoutError}`, task.id);
        }
      }
    }

    // Execute the work loop
    await this.workLoop(task);
  }

  /**
   * Continue working on an in-progress task
   * @param task - The task to continue
   */
  private async continueTask(task: Task): Promise<void> {
    await this.logActivity('task_continue', `Continuing task: ${task.title}`, task.id);

    // Execute the work loop
    await this.workLoop(task);
  }

  /**
   * Main work loop - iterates until task is complete or blocked
   * @param task - The task being worked on
   */
  private async workLoop(task: Task): Promise<void> {
    let iteration = 0;
    let parseFailures = 0;
    const iterationTimeoutMs = 3 * 60 * 1000; // 3 minutes per iteration max

    while (iteration < this.maxIterations) {
      iteration++;

      try {
        const prompt = await this.buildWorkPrompt(task);
        
        // Race LLM call against timeout to prevent indefinite hangs
        const llmPromise = this.think(prompt);
        const response = await Promise.race([
          llmPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`LLM iteration timeout after ${iterationTimeoutMs}ms`)), iterationTimeoutMs)
          )
        ]);
        
        const status = await this.processResponse(response.content, task);

        if (status === 'complete' || status === 'blocked') {
          return;
        }

        if (status === 'error') {
          parseFailures++;
          if (parseFailures >= 2) {
            await this.markTaskBlocked(task, 'Repeated response parsing errors');
            return;
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        await this.logActivity('error', `Work loop iteration ${iteration} failed: ${errorMsg}`, task.id);
        
        // If we've had multiple failures, block the task
        if (iteration >= 3) {
          await this.markTaskBlocked(task, `Multiple work loop failures: ${errorMsg}`);
          return;
        }
        // Otherwise continue to next iteration
      }
    }

    await this.markTaskBlocked(task, 'Max iterations reached without completion');
  }

  /**
   * Process the LLM response and execute actions
   * @param content - The LLM response content
   * @param task - The current task
   */
  private async processResponse(
    content: string,
    task: Task,
  ): Promise<'complete' | 'blocked' | 'working' | 'error'> {
    try {
      // Extract JSON from response
      let jsonContent = content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);

      // Log thinking
      if (parsed.thinking) {
        await this.logActivity('thinking', parsed.thinking, task.id);
      }

      // Execute tool calls
      if (parsed.actions && Array.isArray(parsed.actions)) {
        for (const action of parsed.actions) {
          const tool = this.tools.get(action.tool);
          if (tool) {
            try {
              const result = await tool.execute(action.args || {});
              await this.logActivity(
                'tool_call',
                `${action.tool}: ${JSON.stringify(result).slice(0, 500)}`,
                task.id,
              );
              // Store result as message for context
              await this.sendMessage(
                `Tool ${action.tool} result: ${JSON.stringify(result).slice(0, 1000)}`,
                undefined,
                task.id,
              );
            } catch (toolError) {
              await this.logActivity('tool_error', `${action.tool} failed: ${toolError}`, task.id);
            }
          } else {
            await this.logActivity('warning', `Tool not found: ${action.tool}`, task.id);
          }
        }
      }

      // Update task based on status
      if (parsed.status === 'complete') {
        // Commit and push changes before marking complete
        const gitTool = this.tools.get('git');
        if (gitTool && task.branchName) {
          try {
            await gitTool.execute({ action: 'add', files: ['.'] });
            await gitTool.execute({
              action: 'commit',
              message: `feat(${task.branchName}): ${task.title}\n\n${parsed.summary || 'Task completed by Worker agent'}`,
            });
            await gitTool.execute({ action: 'push', remote: 'origin', branch: task.branchName });
            await this.logActivity('git', `Committed and pushed to ${task.branchName}`, task.id);
          } catch (gitError) {
            await this.logActivity('warning', `Git commit/push failed: ${gitError}`, task.id);
          }
        }

        await this.prisma.task.update({
          where: { id: task.id },
          data: {
            status: 'review',
            result: parsed.summary,
            completedAt: new Date(),
          },
        });
        await this.sendMessage(`✅ Task complete: ${parsed.summary}`, undefined, task.id);
        await this.logActivity('task_complete', `Completed: ${task.title}`, task.id);
        this.dispatchReviewEvent(task);
        return 'complete';
      } else if (parsed.status === 'blocked') {
        await this.markTaskBlocked(task, parsed.summary || 'Blocked without summary');
        return 'blocked';
      } else {
        // Status is 'working' - log progress
        await this.sendMessage(
          `🔄 Progress: ${parsed.summary || 'Working...'}`,
          undefined,
          task.id,
        );
        return 'working';
      }
    } catch (e) {
      await this.logActivity('error', `Failed to process response: ${e}`, task.id);
      // Don't block the task for parse errors - log and continue
      await this.sendMessage(`⚠️ Worker encountered an error: ${e}`, undefined, task.id);
      return 'error';
    }
  }

  private async buildWorkPrompt(task: Task): Promise<string> {
    const messages = await this.prisma.message.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'asc' },
      take: 20, // Limit context window
    });

    const previousContext =
      messages.length > 0
        ? `\nPREVIOUS CONTEXT:\n${messages.map((m) => m.content).join('\n---\n')}`
        : '';

    const toolDefs = this.getToolDefinitions();

    return `
You are working on a coding task.

TASK:
Title: ${task.title}
Description: ${task.description || 'No description'}
Branch: ${task.branchName || 'Not created yet'}

AVAILABLE TOOLS:
${toolDefs || 'No tools registered yet'}
${previousContext}

INSTRUCTIONS:
1. Analyze what needs to be done
2. Plan your approach
3. Use the available tools to complete the task
4. Write clean, tested code
5. When completely done, set status to "complete"
6. If you cannot proceed, set status to "blocked"

Respond with a JSON object:
{
  "thinking": "your analysis and plan",
  "actions": [
    {"tool": "tool_name", "args": {"arg1": "value1"}}
  ],
  "status": "working" | "complete" | "blocked",
  "summary": "what you did or why you're blocked"
}
`;
  }

  private async markTaskBlocked(task: Task, reason: string): Promise<void> {
    await this.prisma.task.update({
      where: { id: task.id },
      data: { status: 'blocked', error: reason },
    });
    await this.sendMessage(`🚫 BLOCKED: ${reason}`, undefined, task.id);
    await this.logActivity('task_blocked', `Blocked: ${reason}`, task.id);
    this.dispatchBlockedEvent(task, reason);
  }

  private dispatchReviewEvent(task: Task): void {
    const eventBus = this.getEventBus();
    if (!eventBus) return;
    eventBus.dispatch({ type: 'task:review_needed', task });
  }

  private dispatchBlockedEvent(task: Task, reason: string): void {
    const eventBus = this.getEventBus();
    if (!eventBus) return;
    eventBus.dispatch({ type: 'task:blocked', task, error: reason });
  }

  private getEventBus(): EventBus | null {
    try {
      return EventBus.getInstance();
    } catch {
      return null;
    }
  }
}
