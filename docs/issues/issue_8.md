# [Agent] Implement Worker (Coder) agent

## 🎯 Objective
Implement the Worker agent that executes coding tasks. This agent writes code, runs commands, and ships features.

## 📋 Dependencies
- **REQUIRES**: #6 (BaseAgent class must exist)
- **REQUIRES**: #10, #12, #13 (FileSystem, Shell, Git tools for full functionality)
- **BLOCKS**: None
- **CAN START EARLY**: Yes, with stub tools. Tools can be integrated later.

## 🏗️ Implementation Details

### File to Create
`src/agents/WorkerAgent.ts`

### System Prompt (from WORKER_SOUL.md)
```
You are a WORKER. You are a builder.
You take tasks and turn them into working code.
You execute commands, write files, run tests.
You ship fast, iterate, and don't overthink.
You follow project conventions and write clean code.
```

### Model Config
- Provider: `deepseek`
- Model: `deepseek-chat` (V3 optimized for coding)
- Temperature: `0.0` (deterministic for code)

### Class Structure
```typescript
import { PrismaClient, Agent, Task } from '@prisma/client';
import { BaseAgent, Tool } from './BaseAgent';

export class WorkerAgent extends BaseAgent {
  private currentTask: Task | null = null;

  constructor(prisma: PrismaClient, agentRecord: Agent) {
    super(prisma, agentRecord);
  }

  async heartbeat(): Promise<void> {
    await this.updateStatus('busy');

    // 1. Check for assigned tasks
    const assignedTask = await this.prisma.task.findFirst({
      where: { assigneeId: this.agentRecord.id, status: 'assigned' }
    });

    if (assignedTask) {
      this.currentTask = assignedTask;
      await this.executeTask(assignedTask);
    } else {
      // Check if current task is in_progress
      const inProgressTask = await this.prisma.task.findFirst({
        where: { assigneeId: this.agentRecord.id, status: 'in_progress' }
      });
      if (inProgressTask) {
        this.currentTask = inProgressTask;
        await this.continueTask(inProgressTask);
      }
    }

    await this.updateStatus('idle');
  }

  private async executeTask(task: Task): Promise<void> {
    await this.logActivity('task_start', `Starting task: ${task.title}`, task.id);
    
    // Update status to in_progress
    await this.prisma.task.update({
      where: { id: task.id },
      data: { status: 'in_progress', startedAt: new Date() }
    });

    // Build context for LLM
    const toolDefs = this.getToolDefinitions();
    const prompt = `
You are working on a coding task.

TASK:
Title: ${task.title}
Description: ${task.description || 'No description'}

AVAILABLE TOOLS:
${toolDefs}

INSTRUCTIONS:
1. Analyze what needs to be done
2. Use the available tools to complete the task
3. Write clean, tested code
4. When done, respond with: {"status": "complete", "summary": "what you did"}
5. If blocked, respond with: {"status": "blocked", "reason": "why"}

Respond with a JSON object containing the tool calls you want to make:
{
  "thinking": "your analysis",
  "actions": [
    {"tool": "tool_name", "args": {...}}
  ],
  "status": "working|complete|blocked",
  "summary": "progress update"
}
`;

    const response = await this.think(prompt);
    await this.processResponse(response.content, task);
  }

  private async continueTask(task: Task): Promise<void> {
    // Similar to executeTask but with context from previous work
    await this.logActivity('task_continue', `Continuing task: ${task.title}`, task.id);
    // Load previous messages for context
    const messages = await this.prisma.message.findMany({
      where: { taskId: task.id },
      orderBy: { createdAt: 'asc' }
    });
    // Continue work...
  }

  private async processResponse(content: string, task: Task): Promise<void> {
    try {
      const parsed = JSON.parse(content);
      
      // Execute tool calls
      if (parsed.actions) {
        for (const action of parsed.actions) {
          const tool = this.tools.get(action.tool);
          if (tool) {
            const result = await tool.execute(action.args);
            await this.logActivity('tool_call', `${action.tool}: ${JSON.stringify(result)}`, task.id);
          }
        }
      }

      // Update task based on status
      if (parsed.status === 'complete') {
        await this.prisma.task.update({
          where: { id: task.id },
          data: { status: 'review', result: parsed.summary, completedAt: new Date() }
        });
        await this.sendMessage(`Task complete: ${parsed.summary}`, undefined, task.id);
      } else if (parsed.status === 'blocked') {
        await this.prisma.task.update({
          where: { id: task.id },
          data: { status: 'blocked', error: parsed.reason }
        });
        await this.sendMessage(`BLOCKED: ${parsed.reason}`, undefined, task.id);
      }
    } catch (e) {
      await this.logActivity('error', `Failed to process response: ${e}`, task.id);
    }
  }
}
```

### Export
Add to `src/agents/index.ts`:
```typescript
export * from './WorkerAgent';
```

## ✅ Acceptance Criteria
- [ ] `WorkerAgent` extends `BaseAgent`
- [ ] `heartbeat()` picks up assigned tasks
- [ ] `executeTask()` calls LLM with task context and tools
- [ ] `processResponse()` executes tool calls and updates status
- [ ] Handles complete/blocked/working states
- [ ] TypeScript compiles without errors

## 📁 Files to Create/Modify
- CREATE: `src/agents/WorkerAgent.ts`
- MODIFY: `src/agents/index.ts` (add export)

## 🧪 Verification
```bash
npm run build
```

## ⏱️ Estimated Time
2-3 hours

## 🏷️ Labels
`agent-system`, `depends-on-6`
