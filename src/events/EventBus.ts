import { EventEmitter } from 'events';
import { PrismaClient, Task } from '@prisma/client';

/**
 * Event types that trigger agent actions
 */
export type AgentEvent =
  | { type: 'task:created'; task: Task }
  | { type: 'task:assigned'; task: Task; agentId: string }
  | { type: 'task:completed'; task: Task }
  | { type: 'task:blocked'; task: Task; error: string }
  | { type: 'task:review_needed'; task: Task }
  | { type: 'task:approved'; task: Task }
  | { type: 'task:rejected'; task: Task; feedback: string }
  | { type: 'agent:idle'; agentId: string };

/**
 * EventBus - Central event dispatcher for AgentOS
 *
 * Replaces polling with event-driven execution:
 * - When a task is created → Orchestrator processes immediately
 * - When a task is assigned → Worker starts immediately
 * - When a task is completed → Reviewer reviews immediately
 * - When an agent becomes idle → Gets next task immediately
 */
export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private prisma: PrismaClient;
  private processing = new Set<string>(); // Prevent duplicate processing

  private constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.setMaxListeners(50); // Allow many listeners
  }

  static getInstance(prisma?: PrismaClient): EventBus {
    if (!EventBus.instance) {
      if (!prisma) throw new Error('PrismaClient required for first initialization');
      EventBus.instance = new EventBus(prisma);
    }
    return EventBus.instance;
  }

  /**
   * Emit an event and trigger handlers
   */
  dispatch(event: AgentEvent): void {
    const eventKey = `${event.type}:${'task' in event ? event.task.id : event.agentId}`;

    // Debounce: Skip if already processing this exact event
    if (this.processing.has(eventKey)) {
      console.log(`[EventBus] Skipping duplicate event: ${eventKey}`);
      return;
    }

    this.processing.add(eventKey);
    console.log(`[EventBus] Dispatching: ${event.type}`);

    // Emit to listeners
    this.emit(event.type, event);

    // Clean up after 5 seconds
    setTimeout(() => this.processing.delete(eventKey), 5000);
  }

  /**
   * Subscribe to events
   */
  subscribe(eventType: AgentEvent['type'], handler: (event: AgentEvent) => Promise<void>): void {
    this.on(eventType, async (event: AgentEvent) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${eventType}:`, error);
      }
    });
  }

  /**
   * Log activity and emit event atomically
   */
  async logAndDispatch(
    agentId: string,
    eventType: string,
    message: string,
    taskId: string | undefined,
    event: AgentEvent,
  ): Promise<void> {
    await this.prisma.activity.create({
      data: {
        eventType,
        agentId,
        taskId,
        message,
        metadata: {},
      },
    });
    this.dispatch(event);
  }
}
