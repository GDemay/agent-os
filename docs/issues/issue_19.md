# [Dashboard] Implement backend API for dashboard

## 🎯 Objective
Create REST API endpoints for the dashboard to query tasks, agents, and activities.

## 📋 Dependencies
- **REQUIRES**: Prisma schema (already done)
- **BLOCKS**: #20 (Dashboard UI needs this API)
- **PARALLEL**: Can be built alongside #18 (CLI)

## 🏗️ Implementation Details

### Dependencies to Install
```bash
npm install express cors
npm install -D @types/express @types/cors
```

### File to Create
`src/api/server.ts`

### Implementation
```typescript
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tasks
app.get('/api/tasks', async (req: Request, res: Response) => {
  const { status, assignee, limit = 50 } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (assignee) where.assigneeId = assignee;
  
  const tasks = await prisma.task.findMany({
    where,
    include: { assignee: true, createdBy: true },
    orderBy: { priority: 'desc' },
    take: Number(limit)
  });
  res.json(tasks);
});

app.get('/api/tasks/:id', async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: { 
      assignee: true, 
      createdBy: true,
      messages: { orderBy: { createdAt: 'asc' } },
      subtasks: true
    }
  });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.post('/api/tasks', async (req: Request, res: Response) => {
  const { title, description, priority = 0 } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  
  const task = await prisma.task.create({
    data: { title, description, priority, status: 'inbox' }
  });
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', async (req: Request, res: Response) => {
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(task);
});

// Agents
app.get('/api/agents', async (req: Request, res: Response) => {
  const agents = await prisma.agent.findMany({
    include: {
      tasksAssigned: { where: { status: { in: ['assigned', 'in_progress'] } } }
    }
  });
  res.json(agents);
});

app.get('/api/agents/:id', async (req: Request, res: Response) => {
  const agent = await prisma.agent.findUnique({
    where: { id: req.params.id },
    include: {
      tasksAssigned: { orderBy: { createdAt: 'desc' }, take: 10 },
      activities: { orderBy: { createdAt: 'desc' }, take: 20 }
    }
  });
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

// Activities (audit log)
app.get('/api/activities', async (req: Request, res: Response) => {
  const { agent, task, limit = 100 } = req.query;
  const where: any = {};
  if (agent) where.agentId = agent;
  if (task) where.taskId = task;
  
  const activities = await prisma.activity.findMany({
    where,
    include: { agent: true, task: true },
    orderBy: { createdAt: 'desc' },
    take: Number(limit)
  });
  res.json(activities);
});

// Messages
app.get('/api/tasks/:id/messages', async (req: Request, res: Response) => {
  const messages = await prisma.message.findMany({
    where: { taskId: req.params.id },
    include: { fromAgent: true, toAgent: true },
    orderBy: { createdAt: 'asc' }
  });
  res.json(messages);
});

app.post('/api/tasks/:id/messages', async (req: Request, res: Response) => {
  const { content, fromAgentId } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  
  const message = await prisma.message.create({
    data: {
      taskId: req.params.id,
      content,
      fromAgentId,
      messageType: 'comment'
    }
  });
  res.status(201).json(message);
});

// Dashboard stats
app.get('/api/stats', async (req: Request, res: Response) => {
  const [tasksByStatus, agents, recentActivity] = await Promise.all([
    prisma.task.groupBy({ by: ['status'], _count: true }),
    prisma.agent.findMany({ select: { id: true, name: true, role: true, status: true } }),
    prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
  ]);
  
  res.json({
    tasks: tasksByStatus.reduce((acc, t) => ({ ...acc, [t.status]: t._count }), {}),
    agents,
    recentActivity
  });
});

export function startServer() {
  app.listen(PORT, () => {
    console.log(`🌐 API server running on http://localhost:${PORT}`);
  });
}

// Run if called directly
if (require.main === module) {
  startServer();
}
```

### Export
Create `src/api/index.ts`:
```typescript
export * from './server';
```

### Add to package.json
```json
{
  "scripts": {
    "api": "ts-node src/api/server.ts"
  }
}
```

## ✅ Acceptance Criteria
- [ ] `GET /api/health` returns status
- [ ] `GET /api/tasks` returns task list with filters
- [ ] `GET /api/tasks/:id` returns task with messages/subtasks
- [ ] `POST /api/tasks` creates new task
- [ ] `PATCH /api/tasks/:id` updates task
- [ ] `GET /api/agents` returns all agents
- [ ] `GET /api/agents/:id` returns agent with activities
- [ ] `GET /api/activities` returns activity log
- [ ] `GET /api/stats` returns dashboard summary
- [ ] CORS enabled
- [ ] TypeScript compiles without errors

## 📁 Files to Create/Modify
- CREATE: `src/api/server.ts`
- CREATE: `src/api/index.ts`
- MODIFY: `package.json` (add api script, dependencies)

## 🧪 Verification
```bash
npm install express cors @types/express @types/cors
npm run build
npm run api
# In another terminal:
curl http://localhost:3001/api/health
curl http://localhost:3001/api/tasks
```

## ⏱️ Estimated Time
2-3 hours

## 🏷️ Labels
`api`, `dashboard`, `independent`
