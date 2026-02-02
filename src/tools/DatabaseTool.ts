import { PrismaClient, Prisma } from '@prisma/client';
import { Tool } from '../agents/BaseAgent';

/**
 * Arguments for Database tool operations
 */
export interface DatabaseArgs {
  entity: 'task' | 'message' | 'agent' | 'activity';
  action: 'create' | 'read' | 'update' | 'delete' | 'list' | 'count';
  id?: string;
  data?: Record<string, unknown>;
  filter?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  skip?: number;
  include?: Record<string, boolean>;
}

/**
 * Create a Database tool instance with the given Prisma client
 *
 * This factory function creates a tool that provides CRUD operations
 * for the main entities: Task, Message, Agent, Activity
 *
 * @param prisma - PrismaClient instance
 * @returns Tool instance
 */
export function createDatabaseTool(prisma: PrismaClient): Tool {
  return {
    name: 'database',
    description:
      'CRUD operations for database entities. Entities: task, message, agent, activity. Actions: create, read, update, delete, list, count',
    parameters: {
      entity: { type: 'string', enum: ['task', 'message', 'agent', 'activity'] },
      action: { type: 'string', enum: ['create', 'read', 'update', 'delete', 'list', 'count'] },
      id: { type: 'string', description: 'Entity ID (for read/update/delete)' },
      data: { type: 'object', description: 'Data for create/update' },
      filter: { type: 'object', description: 'Filter conditions for list/count' },
      orderBy: { type: 'object', description: 'Sort order, e.g., { createdAt: "desc" }' },
      take: { type: 'number', description: 'Limit results (default: 50)' },
      skip: { type: 'number', description: 'Skip results (for pagination)' },
      include: { type: 'object', description: 'Relations to include' },
    },

    async execute(args: Record<string, unknown>): Promise<unknown> {
      const {
        entity,
        action,
        id,
        data,
        filter,
        orderBy,
        take = 50,
        skip = 0,
        include,
      } = args as unknown as DatabaseArgs;

      try {
        switch (entity) {
          case 'task':
            return await handleTask(prisma, action, { id, data, filter, orderBy, take, skip, include });

          case 'message':
            return await handleMessage(prisma, action, { id, data, filter, orderBy, take, skip });

          case 'agent':
            return await handleAgent(prisma, action, { id, data, filter, orderBy, take, skip });

          case 'activity':
            return await handleActivity(prisma, action, { id, data, filter, orderBy, take, skip });

          default:
            throw new Error(`Unknown entity: ${entity}`);
        }
      } catch (error: unknown) {
        const err = error as { message?: string; code?: string };
        return {
          success: false,
          error: err.message || 'Database operation failed',
          code: err.code,
        };
      }
    },
  };
}

/**
 * Handle Task entity operations
 */
async function handleTask(
  prisma: PrismaClient,
  action: string,
  options: {
    id?: string;
    data?: Record<string, unknown>;
    filter?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
    skip?: number;
    include?: Record<string, boolean>;
  }
): Promise<unknown> {
  const { id, data, filter, orderBy, take, skip, include } = options;

  switch (action) {
    case 'create':
      if (!data) throw new Error('Data required for create');
      const created = await prisma.task.create({
        data: data as Prisma.TaskCreateInput,
        include: include as Prisma.TaskInclude,
      });
      return { success: true, task: created };

    case 'read':
      if (!id) throw new Error('ID required for read');
      const task = await prisma.task.findUnique({
        where: { id },
        include: include as Prisma.TaskInclude || { subtasks: true, messages: true },
      });
      if (!task) return { success: false, error: 'Task not found' };
      return { success: true, task };

    case 'update':
      if (!id) throw new Error('ID required for update');
      if (!data) throw new Error('Data required for update');
      const updated = await prisma.task.update({
        where: { id },
        data: data as Prisma.TaskUpdateInput,
      });
      return { success: true, task: updated };

    case 'delete':
      if (!id) throw new Error('ID required for delete');
      await prisma.task.delete({ where: { id } });
      return { success: true, deleted: id };

    case 'list':
      const tasks = await prisma.task.findMany({
        where: filter as Prisma.TaskWhereInput,
        orderBy: orderBy as Prisma.TaskOrderByWithRelationInput || { createdAt: 'desc' },
        take,
        skip,
        include: include as Prisma.TaskInclude,
      });
      return { success: true, tasks, count: tasks.length };

    case 'count':
      const taskCount = await prisma.task.count({
        where: filter as Prisma.TaskWhereInput,
      });
      return { success: true, count: taskCount };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Handle Message entity operations
 */
async function handleMessage(
  prisma: PrismaClient,
  action: string,
  options: {
    id?: string;
    data?: Record<string, unknown>;
    filter?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
    skip?: number;
  }
): Promise<unknown> {
  const { id, data, filter, orderBy, take, skip } = options;

  switch (action) {
    case 'create':
      if (!data) throw new Error('Data required for create');
      const created = await prisma.message.create({
        data: data as Prisma.MessageCreateInput,
      });
      return { success: true, message: created };

    case 'read':
      if (!id) throw new Error('ID required for read');
      const message = await prisma.message.findUnique({ where: { id } });
      if (!message) return { success: false, error: 'Message not found' };
      return { success: true, message };

    case 'update':
      if (!id) throw new Error('ID required for update');
      if (!data) throw new Error('Data required for update');
      const updated = await prisma.message.update({
        where: { id },
        data: data as Prisma.MessageUpdateInput,
      });
      return { success: true, message: updated };

    case 'delete':
      if (!id) throw new Error('ID required for delete');
      await prisma.message.delete({ where: { id } });
      return { success: true, deleted: id };

    case 'list':
      const messages = await prisma.message.findMany({
        where: filter as Prisma.MessageWhereInput,
        orderBy: orderBy as Prisma.MessageOrderByWithRelationInput || { createdAt: 'desc' },
        take: Math.min(take || 100, 100),
        skip,
      });
      return { success: true, messages, count: messages.length };

    case 'count':
      const messageCount = await prisma.message.count({
        where: filter as Prisma.MessageWhereInput,
      });
      return { success: true, count: messageCount };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Handle Agent entity operations
 */
async function handleAgent(
  prisma: PrismaClient,
  action: string,
  options: {
    id?: string;
    data?: Record<string, unknown>;
    filter?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
    skip?: number;
  }
): Promise<unknown> {
  const { id, data, filter, orderBy, take, skip } = options;

  switch (action) {
    case 'create':
      if (!data) throw new Error('Data required for create');
      const created = await prisma.agent.create({
        data: data as Prisma.AgentCreateInput,
      });
      return { success: true, agent: created };

    case 'read':
      if (!id) throw new Error('ID required for read');
      const agent = await prisma.agent.findUnique({ where: { id } });
      if (!agent) return { success: false, error: 'Agent not found' };
      return { success: true, agent };

    case 'update':
      if (!id) throw new Error('ID required for update');
      if (!data) throw new Error('Data required for update');
      const updated = await prisma.agent.update({
        where: { id },
        data: data as Prisma.AgentUpdateInput,
      });
      return { success: true, agent: updated };

    case 'delete':
      if (!id) throw new Error('ID required for delete');
      await prisma.agent.delete({ where: { id } });
      return { success: true, deleted: id };

    case 'list':
      const agents = await prisma.agent.findMany({
        where: filter as Prisma.AgentWhereInput,
        orderBy: orderBy as Prisma.AgentOrderByWithRelationInput || { createdAt: 'desc' },
        take,
        skip,
      });
      return { success: true, agents, count: agents.length };

    case 'count':
      const agentCount = await prisma.agent.count({
        where: filter as Prisma.AgentWhereInput,
      });
      return { success: true, count: agentCount };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Handle Activity entity operations
 */
async function handleActivity(
  prisma: PrismaClient,
  action: string,
  options: {
    id?: string;
    data?: Record<string, unknown>;
    filter?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    take?: number;
    skip?: number;
  }
): Promise<unknown> {
  const { id, data, filter, orderBy, take, skip } = options;

  switch (action) {
    case 'create':
      if (!data) throw new Error('Data required for create');
      const created = await prisma.activity.create({
        data: data as Prisma.ActivityCreateInput,
      });
      return { success: true, activity: created };

    case 'read':
      if (!id) throw new Error('ID required for read');
      const activity = await prisma.activity.findUnique({ where: { id } });
      if (!activity) return { success: false, error: 'Activity not found' };
      return { success: true, activity };

    case 'list':
      const activities = await prisma.activity.findMany({
        where: filter as Prisma.ActivityWhereInput,
        orderBy: orderBy as Prisma.ActivityOrderByWithRelationInput || { createdAt: 'desc' },
        take: Math.min(take || 100, 100),
        skip,
      });
      return { success: true, activities, count: activities.length };

    case 'count':
      const activityCount = await prisma.activity.count({
        where: filter as Prisma.ActivityWhereInput,
      });
      return { success: true, count: activityCount };

    // Activity records are generally not updated/deleted
    case 'update':
    case 'delete':
      throw new Error('Activity records cannot be updated or deleted');

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
