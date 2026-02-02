# [Agent] Implement Orchestrator (Planner) agent

## 🎯 Objective
Implement the Orchestrator agent that breaks down high-level goals into tasks and monitors system health. This is the "brain" of the system.

## 📋 Dependencies
- **REQUIRES**: #6 (BaseAgent class must exist)
- **BLOCKS**: None (can run in parallel with #8, #9 after #6 is done)

## 🏗️ Implementation Details

### File to Create
`src/agents/OrchestratorAgent.ts`

### System Prompt (from ORCHESTRATOR_SOUL.md)
```
You are the ORCHESTRATOR. You are the system's brain.
You do not write code—you create clear, actionable tasks for Workers.
You break goals into atomic tasks.
You monitor system health and worker progress.
You define priorities and handle task assignment.
```

### Model Config
- Provider: `deepseek`
- Model: `deepseek-reasoner` (R1 for complex planning)
- Temperature: `0.6`

### Class Structure
```typescript
import { PrismaClient, Agent, Task } from '@prisma/client';
import { BaseAgent } from './BaseAgent';

export class OrchestratorAgent extends BaseAgent {
  constructor(prisma: PrismaClient, agentRecord: Agent) {
    super(prisma, agentRecord);
  }

  async heartbeat(): Promise<void> {
    await this.updateStatus('busy');
    await this.logActivity('heartbeat', 'Orchestrator heartbeat started');

    // 1. Check for new goals (tasks with status 'inbox' and no parent)
    const newGoals = await this.prisma.task.findMany({
      where: { status: 'inbox', parentTaskId: null }
    });

    // 2. For each goal, break down into subtasks
    for (const goal of newGoals) {
      await this.breakdownGoal(goal);
    }

    // 3. Check for blocked tasks
    const blockedTasks = await this.prisma.task.findMany({
      where: { status: 'blocked' }
    });
    for (const task of blockedTasks) {
      await this.handleBlockedTask(task);
    }

    // 4. Check for idle workers and assign tasks
    await this.assignTasks();

    await this.updateStatus('idle');
    await this.logActivity('heartbeat', 'Orchestrator heartbeat complete');
  }

  private async breakdownGoal(goal: Task): Promise<void> {
    const prompt = `
You are breaking down a goal into actionable tasks.

GOAL:
Title: ${goal.title}
Description: ${goal.description || 'No description'}

Break this into 3-7 atomic, actionable tasks. Each task should:
- Be completable by a single developer in 1-4 hours
- Have a clear deliverable
- Be independent when possible

Respond in JSON format:
{
  "tasks": [
    { "title": "Task title", "description": "What to do", "priority": 1 }
  ]
}
`;

    const response = await this.think(prompt);
    // Parse response and create subtasks
    try {
      const parsed = JSON.parse(response.content);
      for (const task of parsed.tasks) {
        await this.prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            parentTaskId: goal.id,
            createdById: this.agentRecord.id,
            status: 'inbox'
          }
        });
      }
      // Update goal status
      await this.prisma.task.update({
        where: { id: goal.id },
        data: { status: 'in_progress' }
      });
    } catch (e) {
      await this.logActivity('error', `Failed to parse breakdown: ${e}`, goal.id);
    }
  }

  private async handleBlockedTask(task: Task): Promise<void> {
    // Log and attempt to resolve
    await this.logActivity('review', `Reviewing blocked task: ${task.title}`, task.id);
  }

  private async assignTasks(): Promise<void> {
    // Find idle workers
    const idleWorkers = await this.prisma.agent.findMany({
      where: { role: 'worker', status: 'idle' }
    });

    // Find unassigned tasks
    const unassignedTasks = await this.prisma.task.findMany({
      where: { status: 'inbox', assigneeId: null },
      orderBy: { priority: 'desc' },
      take: idleWorkers.length
    });

    // Assign tasks to workers
    for (let i = 0; i < Math.min(idleWorkers.length, unassignedTasks.length); i++) {
      await this.prisma.task.update({
        where: { id: unassignedTasks[i].id },
        data: { assigneeId: idleWorkers[i].id, status: 'assigned' }
      });
      await this.sendMessage(
        `Assigned task: ${unassignedTasks[i].title}`,
        idleWorkers[i].id,
        unassignedTasks[i].id
      );
    }
  }
}
```

### Export
Add to `src/agents/index.ts`:
```typescript
export * from './OrchestratorAgent';
```

## ✅ Acceptance Criteria
- [ ] `OrchestratorAgent` extends `BaseAgent`
- [ ] `heartbeat()` checks for new goals, blocked tasks, idle workers
- [ ] `breakdownGoal()` uses LLM to create subtasks
- [ ] `assignTasks()` matches tasks to idle workers
- [ ] Activity logging on all major actions
- [ ] TypeScript compiles without errors

## 📁 Files to Create/Modify
- CREATE: `src/agents/OrchestratorAgent.ts`
- MODIFY: `src/agents/index.ts` (add export)

## 🧪 Verification
```bash
npm run build
# Should compile with no errors
```

## ⏱️ Estimated Time
2-3 hours

## 🏷️ Labels
`agent-system`, `depends-on-6`
