# [Agent] Create BaseAgent class with tool system

## 🎯 Objective
Create an abstract `BaseAgent` class that all agents (Orchestrator, Worker, Reviewer) will extend. This class provides the core "loop" of an agent: wake up → think → act → sleep.

## 📋 Dependencies
- **REQUIRES**: None (this is a foundational task)
- **BLOCKS**: #7, #8, #9 (all specific agent implementations need this)

## 🏗️ Implementation Details

### File to Create
`src/agents/BaseAgent.ts`

### Required Imports
```typescript
import { PrismaClient, Agent, Task } from '@prisma/client';
import { LLMFactory, LLMProvider, LLMMessage, LLMResponse } from '../lib/llm';
```

### Class Structure
```typescript
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface AgentConfig {
  id: string;
  systemPrompt: string;
  modelConfig: {
    provider: string;
    model: string;
    temperature: number;
  };
}

export abstract class BaseAgent {
  protected prisma: PrismaClient;
  protected llm: LLMProvider;
  protected agentRecord: Agent;
  protected tools: Map<string, Tool> = new Map();

  constructor(prisma: PrismaClient, agentRecord: Agent) {
    this.prisma = prisma;
    this.agentRecord = agentRecord;
    const config = agentRecord.modelConfig as AgentConfig['modelConfig'];
    this.llm = LLMFactory.create(config.provider);
  }

  registerTool(tool: Tool): void { this.tools.set(tool.name, tool); }

  getToolDefinitions(): string {
    return Array.from(this.tools.values()).map(t => `- ${t.name}: ${t.description}`).join('\n');
  }

  abstract heartbeat(): Promise<void>;

  async updateStatus(status: 'online' | 'offline' | 'busy' | 'idle'): Promise<void> {
    await this.prisma.agent.update({
      where: { id: this.agentRecord.id },
      data: { status, lastHeartbeat: new Date() }
    });
  }

  async logActivity(eventType: string, message: string, taskId?: string): Promise<void> {
    await this.prisma.activity.create({
      data: { eventType, agentId: this.agentRecord.id, taskId, message, metadata: {} }
    });
  }

  async sendMessage(content: string, toAgentId?: string, taskId?: string): Promise<void> {
    await this.prisma.message.create({
      data: { content, fromAgentId: this.agentRecord.id, toAgentId, taskId, messageType: 'comment' }
    });
  }

  protected async think(userPrompt: string): Promise<LLMResponse> {
    const messages: LLMMessage[] = [
      { role: 'system', content: this.agentRecord.systemPrompt || '' },
      { role: 'user', content: userPrompt }
    ];
    const config = this.agentRecord.modelConfig as AgentConfig['modelConfig'];
    return this.llm.generate(messages, { model: config.model, temperature: config.temperature });
  }
}
```

### Export
Create `src/agents/index.ts`:
```typescript
export * from './BaseAgent';
```

## ✅ Acceptance Criteria
- [ ] `BaseAgent` class is abstract with `heartbeat()` method
- [ ] Tool registration system works (`registerTool`, `getToolDefinitions`)
- [ ] `updateStatus()` updates agent in database
- [ ] `logActivity()` creates activity records
- [ ] `sendMessage()` creates message records
- [ ] `think()` calls LLM with agent's system prompt
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Export from `src/agents/index.ts`

## 📁 Files to Create/Modify
- CREATE: `src/agents/BaseAgent.ts`
- CREATE: `src/agents/index.ts`

## 🧪 Verification
```bash
npm run build
# Should compile with no errors
```

## ⏱️ Estimated Time
1-2 hours

## 🏷️ Labels
`agent-system`, `foundation`, `independent`
