# [Scheduler] Implement heartbeat scheduler

## 🎯 Objective
Create a scheduler that runs agent heartbeats at configured intervals.

## 📋 Dependencies
- **REQUIRES**: #6 (BaseAgent class)
- **REQUIRES**: #7, #8, #9 (At least one agent implementation to schedule)
- **BLOCKS**: #16 (Process runner needs scheduler)

## 🏗️ Implementation Details

### File to Create
`src/scheduler/HeartbeatScheduler.ts`

### Design
The scheduler manages the "pulse" of the system:
- Orchestrator: Every 5 minutes
- Worker: Every 2 minutes (when tasks assigned)
- Reviewer: Every 5 minutes

### Implementation
```typescript
import { PrismaClient, Agent } from '@prisma/client';
import { BaseAgent } from '../agents/BaseAgent';
import { OrchestratorAgent } from '../agents/OrchestratorAgent';
import { WorkerAgent } from '../agents/WorkerAgent';
import { ReviewerAgent } from '../agents/ReviewerAgent';

interface ScheduleConfig {
  agentId: string;
  intervalMs: number;
}

const DEFAULT_INTERVALS: Record<string, number> = {
  orchestrator: 5 * 60 * 1000,  // 5 minutes
  worker: 2 * 60 * 1000,        // 2 minutes
  reviewer: 5 * 60 * 1000,      // 5 minutes
};

export class HeartbeatScheduler {
  private prisma: PrismaClient;
  private agents: Map<string, BaseAgent> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private running = false;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async initialize(): Promise<void> {
    // Load all agents from database
    const agentRecords = await this.prisma.agent.findMany();
    
    for (const record of agentRecords) {
      const agent = this.createAgent(record);
      if (agent) {
        this.agents.set(record.id, agent);
      }
    }

    console.log(`Initialized ${this.agents.size} agents`);
  }

  private createAgent(record: Agent): BaseAgent | null {
    switch (record.role) {
      case 'orchestrator':
        return new OrchestratorAgent(this.prisma, record);
      case 'worker':
        return new WorkerAgent(this.prisma, record);
      case 'reviewer':
        return new ReviewerAgent(this.prisma, record);
      default:
        console.warn(`Unknown agent role: ${record.role}`);
        return null;
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    for (const [id, agent] of this.agents) {
      const role = (agent as any).agentRecord?.role || 'worker';
      const interval = DEFAULT_INTERVALS[role] || DEFAULT_INTERVALS.worker;

      // Run immediately
      this.runHeartbeat(id, agent);

      // Then schedule
      const timer = setInterval(() => {
        this.runHeartbeat(id, agent);
      }, interval);

      this.timers.set(id, timer);
      console.log(`Scheduled ${role} agent ${id} every ${interval / 1000}s`);
    }
  }

  stop(): void {
    this.running = false;
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    console.log('Scheduler stopped');
  }

  private async runHeartbeat(id: string, agent: BaseAgent): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] Heartbeat: ${id}`);
      await agent.heartbeat();
    } catch (error) {
      console.error(`Heartbeat failed for ${id}:`, error);
    }
  }
}
```

### Export
Create `src/scheduler/index.ts`:
```typescript
export * from './HeartbeatScheduler';
```

## ✅ Acceptance Criteria
- [ ] Loads agents from database on init
- [ ] Creates correct agent class based on role
- [ ] Schedules heartbeats at role-specific intervals
- [ ] `start()` begins all heartbeat timers
- [ ] `stop()` clears all timers
- [ ] Logs heartbeat execution
- [ ] Error handling for failed heartbeats
- [ ] TypeScript compiles without errors

## 📁 Files to Create/Modify
- CREATE: `src/scheduler/HeartbeatScheduler.ts`
- CREATE: `src/scheduler/index.ts`

## 🧪 Verification
```bash
npm run build
```

## ⏱️ Estimated Time
2-3 hours

## 🏷️ Labels
`scheduler`, `depends-on-6-7-8-9`
