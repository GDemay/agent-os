# [Agent] Implement Reviewer (Judge) agent

## 🎯 Objective
Implement the Reviewer agent that validates code quality and merges approved work to main.

## 📋 Dependencies
- **REQUIRES**: #6 (BaseAgent class must exist)
- **REQUIRES**: #13 (Git tool for merge operations)
- **BLOCKS**: None

## 🏗️ Implementation Details

### File to Create
`src/agents/ReviewerAgent.ts`

### System Prompt (from REVIEWER_SOUL.md)
```
You are the REVIEWER. You are the quality gate.
You validate code quality and ensure it meets requirements.
You look for bugs, security issues, and design flaws.
You approve or reject changes.
You merge approved code to main.
You are thorough but reasonable.
```

### Model Config
- Provider: `deepseek`
- Model: `deepseek-reasoner` (R1 for thorough analysis)
- Temperature: `0.3`

### Class Structure
```typescript
import { PrismaClient, Agent, Task } from '@prisma/client';
import { BaseAgent } from './BaseAgent';

export class ReviewerAgent extends BaseAgent {
  constructor(prisma: PrismaClient, agentRecord: Agent) {
    super(prisma, agentRecord);
  }

  async heartbeat(): Promise<void> {
    await this.updateStatus('busy');
    await this.logActivity('heartbeat', 'Reviewer heartbeat started');

    // 1. Check for tasks in 'review' status
    const reviewTasks = await this.prisma.task.findMany({
      where: { status: 'review' }
    });

    for (const task of reviewTasks) {
      await this.reviewTask(task);
    }

    await this.updateStatus('idle');
    await this.logActivity('heartbeat', 'Reviewer heartbeat complete');
  }

  private async reviewTask(task: Task): Promise<void> {
    await this.logActivity('review_start', `Starting review: ${task.title}`, task.id);

    // Get task context
    const messages = await this.prisma.message.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'asc' }
    });

    const prompt = `
You are reviewing a completed task.

TASK:
Title: ${task.title}
Description: ${task.description || 'No description'}
Result: ${task.result || 'No result provided'}
Branch: ${task.branchName || 'No branch specified'}

PREVIOUS MESSAGES:
${messages.map(m => m.content).join('\n---\n')}

REVIEW CHECKLIST:
- Does the work fulfill the task requirements?
- Are there obvious bugs or issues?
- Is the code clean and maintainable?

Respond with JSON:
{
  "decision": "approve" | "reject",
  "reasoning": "your analysis",
  "feedback": "specific feedback for the worker (if rejecting)"
}
`;

    const response = await this.think(prompt);
    await this.processReview(response.content, task);
  }

  private async processReview(content: string, task: Task): Promise<void> {
    try {
      const parsed = JSON.parse(content);

      if (parsed.decision === 'approve') {
        // Merge to main (using Git tool when available)
        await this.prisma.task.update({
          where: { id: task.id },
          data: { status: 'done', completedAt: new Date() }
        });
        await this.sendMessage(`✅ APPROVED: ${parsed.reasoning}`, undefined, task.id);
        await this.logActivity('review_approve', `Approved: ${task.title}`, task.id);

        // TODO: Call git.merge() tool here
        if (task.branchName) {
          const gitTool = this.tools.get('git');
          if (gitTool) {
            await gitTool.execute({ action: 'merge', branch: task.branchName });
          }
        }
      } else {
        // Reject and send back to worker
        await this.prisma.task.update({
          where: { id: task.id },
          data: { status: 'in_progress' }
        });
        await this.sendMessage(
          `❌ REJECTED: ${parsed.reasoning}\n\nFeedback: ${parsed.feedback}`,
          task.assigneeId || undefined,
          task.id
        );
        await this.logActivity('review_reject', `Rejected: ${task.title}`, task.id);
      }
    } catch (e) {
      await this.logActivity('error', `Failed to process review: ${e}`, task.id);
    }
  }
}
```

### Export
Add to `src/agents/index.ts`:
```typescript
export * from './ReviewerAgent';
```

## ✅ Acceptance Criteria
- [ ] `ReviewerAgent` extends `BaseAgent`
- [ ] `heartbeat()` finds tasks in 'review' status
- [ ] `reviewTask()` uses LLM to analyze work
- [ ] Approve path: updates status to 'done', merges branch
- [ ] Reject path: updates status to 'in_progress', sends feedback
- [ ] TypeScript compiles without errors

## 📁 Files to Create/Modify
- CREATE: `src/agents/ReviewerAgent.ts`
- MODIFY: `src/agents/index.ts` (add export)

## 🧪 Verification
```bash
npm run build
```

## ⏱️ Estimated Time
2-3 hours

## 🏷️ Labels
`agent-system`, `depends-on-6`
