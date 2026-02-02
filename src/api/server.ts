import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.API_PORT || 3001;

// Helper to get param as string
const getIdParam = (req: Request): string => {
  return req.params.id as string;
};

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Health & Stats
// ============================================================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const [tasksByStatus, agents, recentActivity] = await Promise.all([
      prisma.task.groupBy({ by: ['status'], _count: true }),
      prisma.agent.findMany({
        select: { id: true, name: true, role: true, status: true, lastHeartbeat: true },
      }),
      prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { agent: { select: { name: true } } },
      }),
    ]);

    const taskStats = tasksByStatus.reduce(
      (acc, t) => {
        acc[t.status] = t._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    res.json({
      tasks: taskStats,
      agents,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================================================
// Tasks
// ============================================================================

app.get('/api/tasks', async (req: Request, res: Response) => {
  try {
    const { status, assignee, limit = '50', offset = '0' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (assignee) where.assigneeId = assignee;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: Number(limit),
      skip: Number(offset),
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.get('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: getIdParam(req) },
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            fromAgent: { select: { id: true, name: true } },
            toAgent: { select: { id: true, name: true } },
          },
        },
        subtasks: {
          select: { id: true, title: true, status: true, priority: true },
        },
        parentTask: { select: { id: true, title: true } },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const { title, description, priority = 0, parentTaskId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        priority: Number(priority),
        status: 'inbox',
        parentTaskId: parentTaskId || null,
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const allowedFields = [
      'title',
      'description',
      'status',
      'priority',
      'assigneeId',
      'branchName',
    ];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const task = await prisma.task.update({
      where: { id: getIdParam(req) },
      data: updateData,
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    await prisma.task.delete({ where: { id: getIdParam(req) } });
    res.json({ success: true, deleted: getIdParam(req) });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ============================================================================
// Agents
// ============================================================================

app.get('/api/agents', async (req: Request, res: Response) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        tasksAssigned: {
          where: { status: { in: ['assigned', 'in_progress'] } },
          select: { id: true, title: true, status: true },
        },
      },
    });

    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

app.get('/api/agents/:id', async (req: Request, res: Response) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: getIdParam(req) },
      include: {
        tasksAssigned: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, title: true, status: true, priority: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// ============================================================================
// Activities
// ============================================================================

app.get('/api/activities', async (req: Request, res: Response) => {
  try {
    const { agent, task, limit = '100', offset = '0' } = req.query;
    const where: Record<string, unknown> = {};
    if (agent) where.agentId = agent;
    if (task) where.taskId = task;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// ============================================================================
// Messages
// ============================================================================

app.get('/api/tasks/:id/messages', async (req: Request, res: Response) => {
  try {
    const messages = await prisma.message.findMany({
      where: { taskId: getIdParam(req) },
      include: {
        fromAgent: { select: { id: true, name: true } },
        toAgent: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/tasks/:id/messages', async (req: Request, res: Response) => {
  try {
    const { content, fromAgentId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const message = await prisma.message.create({
      data: {
        taskId: getIdParam(req),
        content,
        fromAgentId: fromAgentId || null,
        messageType: 'comment',
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// ============================================================================
// Dashboard Static Files
// ============================================================================

const dashboardDirCandidates = [
  path.join(process.cwd(), 'src', 'dashboard'),
  path.join(process.cwd(), 'dist', 'dashboard'),
  path.join(__dirname, '../dashboard'),
];

const dashboardDir = dashboardDirCandidates.find((dir) => fs.existsSync(dir)) || '';

if (dashboardDir) {
  app.use('/dashboard', express.static(dashboardDir));
  app.get('/dashboard', (req: Request, res: Response) => {
    res.sendFile(path.join(dashboardDir, 'index.html'));
  });
} else {
  console.warn('[API] Dashboard directory not found. UI will not be served.');
}

// Redirect root to dashboard
app.get('/', (req: Request, res: Response) => {
  res.redirect('/dashboard');
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// Server Start
// ============================================================================

export function startServer(): void {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log(`║       🌐 AgentOS API Server running on port ${PORT}            ║`);
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║  Endpoints:                                                   ║');
    console.log('║    GET  /api/health     - Health check                        ║');
    console.log('║    GET  /api/stats      - Dashboard statistics                ║');
    console.log('║    GET  /api/tasks      - List tasks                          ║');
    console.log('║    GET  /api/agents     - List agents                         ║');
    console.log('║    GET  /api/activities - Activity log                        ║');
    console.log('║    GET  /dashboard      - Web dashboard                       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
  });
}

// Run if called directly
if (require.main === module) {
  startServer();
}

export { app, prisma };
