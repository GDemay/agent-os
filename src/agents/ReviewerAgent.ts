import { PrismaClient, Agent, Task } from '@prisma/client';
import { BaseAgent } from './BaseAgent';

/**
 * ReviewerAgent - The system's quality gate
 *
 * Responsibilities:
 * - Review completed tasks
 * - Validate code quality
 * - Approve or reject changes
 * - Merge approved code to main
 */
export class ReviewerAgent extends BaseAgent {
  constructor(prisma: PrismaClient, agentRecord: Agent) {
    super(prisma, agentRecord);
  }

  /**
   * Heartbeat implementation for Reviewer
   * Runs every 5 minutes to:
   * 1. Find tasks in 'review' status
   * 2. Analyze the work done
   * 3. Approve (merge) or reject (send back)
   */
  async heartbeat(): Promise<void> {
    await this.updateStatus('busy');
    await this.logActivity('heartbeat', 'Reviewer heartbeat started');

    try {
      // Find tasks ready for review
      const reviewTasks = await this.prisma.task.findMany({
        where: { status: 'review' },
      });

      for (const task of reviewTasks) {
        await this.reviewTask(task);
      }
    } catch (error) {
      await this.logActivity('error', `Heartbeat error: ${error}`);
    }

    await this.updateStatus('idle');
    await this.logActivity('heartbeat', 'Reviewer heartbeat complete');
  }

  /**
   * Review a completed task
   * @param task - The task to review
   */
  private async reviewTask(task: Task): Promise<void> {
    await this.logActivity('review_start', `Starting review: ${task.title}`, task.id);

    // Get task context - messages and activities
    const messages = await this.prisma.message.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'asc' },
      take: 30,
    });

    const activities = await this.prisma.activity.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const messageContext = messages.map((m) => m.content).join('\n---\n');
    const activityContext = activities.map((a) => `[${a.eventType}] ${a.message}`).join('\n');

    const prompt = `
You are reviewing a completed task.

TASK:
Title: ${task.title}
Description: ${task.description || 'No description'}
Result: ${task.result || 'No result provided'}
Branch: ${task.branchName || 'No branch specified'}

WORK LOG:
${activityContext || 'No activities recorded'}

MESSAGES:
${messageContext || 'No messages'}

REVIEW CHECKLIST:
1. Does the work fulfill the task requirements?
2. Are there obvious bugs or issues?
3. Is the code clean and maintainable?
4. Were tests written or updated?
5. Is the implementation complete?

Make your decision. Be thorough but reasonable - don't block for minor issues.

Respond with JSON:
{
  "decision": "approve" | "reject",
  "reasoning": "detailed analysis",
  "feedback": "specific feedback for the worker (required if rejecting)",
  "improvements": ["optional list of suggestions even if approving"]
}
`;

    const response = await this.think(prompt);
    await this.processReview(response.content, task);
  }

  /**
   * Process the review decision
   * @param content - The LLM response content
   * @param task - The task being reviewed
   */
  private async processReview(content: string, task: Task): Promise<void> {
    try {
      // Extract JSON from response
      let jsonContent = content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);

      if (parsed.decision === 'approve') {
        await this.approveTask(task, parsed);
      } else {
        await this.rejectTask(task, parsed);
      }
    } catch (e) {
      await this.logActivity('error', `Failed to process review: ${e}`, task.id);
      // Don't auto-reject on parse error - log and skip
    }
  }

  /**
   * Approve a task - mark as done and trigger merge
   * @param task - The approved task
   * @param review - The review details
   */
  private async approveTask(
    task: Task,
    review: { reasoning: string; improvements?: string[] },
  ): Promise<void> {
    // Update task status to done
    await this.prisma.task.update({
      where: { id: task.id },
      data: { status: 'done', completedAt: new Date() },
    });

    // Send approval message
    let message = `✅ APPROVED: ${review.reasoning}`;
    if (review.improvements && review.improvements.length > 0) {
      message += `\n\n💡 Suggestions for future:\n${review.improvements.map((i) => `- ${i}`).join('\n')}`;
    }

    await this.sendMessage(message, task.assigneeId || undefined, task.id);
    await this.logActivity('review_approve', `Approved: ${task.title}`, task.id);

    // Trigger git merge if branch exists
    if (task.branchName) {
      await this.mergeBranch(task);
    }

    // Check if parent task is complete
    if (task.parentTaskId) {
      await this.checkParentCompletion(task.parentTaskId);
    }
  }

  /**
   * Reject a task - send back to worker with feedback
   * @param task - The rejected task
   * @param review - The review details with feedback
   */
  private async rejectTask(
    task: Task,
    review: { reasoning: string; feedback: string },
  ): Promise<void> {
    // Update task status back to in_progress
    await this.prisma.task.update({
      where: { id: task.id },
      data: { status: 'in_progress' },
    });

    // Send rejection with feedback
    await this.sendMessage(
      `❌ REJECTED: ${review.reasoning}\n\n📝 Feedback:\n${review.feedback}`,
      task.assigneeId || undefined,
      task.id,
    );

    await this.logActivity('review_reject', `Rejected: ${task.title}`, task.id);
  }

  /**
   * Merge the task branch to main
   * @param task - The task with branch to merge
   */
  private async mergeBranch(task: Task): Promise<void> {
    const gitTool = this.tools.get('git');

    if (gitTool) {
      try {
        // Checkout main first
        await gitTool.execute({ action: 'checkout', branch: 'master' });
        // Pull latest
        await gitTool.execute({ action: 'pull' });
        // Merge feature branch
        await gitTool.execute({
          action: 'merge',
          branch: task.branchName,
        });
        // Push merged changes
        await gitTool.execute({ action: 'push' });
        await this.logActivity('git_merge', `Merged branch ${task.branchName} to master and pushed`, task.id);
        await this.sendMessage(`🔀 Merged ${task.branchName} to master and pushed`, undefined, task.id);
      } catch (mergeError) {
        await this.logActivity('git_error', `Merge failed: ${mergeError}`, task.id);
        await this.sendMessage(
          `⚠️ Merge failed: ${mergeError}. Manual merge may be required.`,
          undefined,
          task.id,
        );
      }
    } else {
      await this.logActivity('warning', 'Git tool not available - skipping merge', task.id);
    }
  }

  /**
   * Check if all subtasks of a parent are complete
   * @param parentId - The parent task ID
   */
  private async checkParentCompletion(parentId: string): Promise<void> {
    const parent = await this.prisma.task.findUnique({
      where: { id: parentId },
      include: { subtasks: true },
    });

    if (!parent) return;

    const allDone = parent.subtasks.every(
      (sub) => sub.status === 'done' || sub.status === 'cancelled',
    );

    if (allDone && parent.status !== 'done') {
      await this.prisma.task.update({
        where: { id: parentId },
        data: { status: 'done', completedAt: new Date() },
      });
      await this.logActivity(
        'parent_complete',
        `All subtasks done - marking parent "${parent.title}" as complete`,
        parentId,
      );
      await this.sendMessage(`🎉 Goal complete: ${parent.title}`, undefined, parentId);

      // Recursively check grandparent
      if (parent.parentTaskId) {
        await this.checkParentCompletion(parent.parentTaskId);
      }
    }
  }
}
