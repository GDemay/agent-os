import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { HeartbeatScheduler } from './scheduler';
import { FileSystemTool, ShellTool, GitTool, createDatabaseTool, WebSearchTool } from './tools';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

/**
 * Main entry point for the AgentOS kernel
 *
 * Starts the heartbeat scheduler and keeps the system running.
 * Handles graceful shutdown on SIGINT/SIGTERM.
 */
async function main(): Promise<void> {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    🚀 AgentOS Kernel v0.1.0                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Validate required environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('⚠️  Warning: DEEPSEEK_API_KEY is not set. LLM calls will fail.');
  }

  console.log('[Kernel] Connecting to database...');

  // Test database connection
  try {
    await prisma.$connect();
    const agentCount = await prisma.agent.count();
    console.log(`[Kernel] Database connected. Found ${agentCount} agents.`);
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }

  // Initialize scheduler
  console.log('[Kernel] Initializing scheduler...');
  const scheduler = new HeartbeatScheduler(prisma);

  // Register tools with the scheduler
  console.log('[Kernel] Registering tools...');
  scheduler.registerTool(FileSystemTool);
  scheduler.registerTool(ShellTool);
  scheduler.registerTool(GitTool);
  scheduler.registerTool(createDatabaseTool(prisma));
  scheduler.registerTool(WebSearchTool);
  console.log('[Kernel] Registered 5 tools: filesystem, shell, git, database, websearch');

  await scheduler.initialize();

  // Start the heartbeat loop
  scheduler.start();

  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║               ✅ AgentOS Kernel is running                    ║');
  console.log('║                                                               ║');
  console.log('║   Orchestrator: Checking for goals every 5 minutes           ║');
  console.log('║   Worker:       Processing tasks every 2 minutes             ║');
  console.log('║   Reviewer:     Reviewing completions every 5 minutes        ║');
  console.log('║                                                               ║');
  console.log('║   Press Ctrl+C to stop                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Handle graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[Kernel] Received ${signal}, shutting down...`);
    scheduler.stop();

    // Update all agents to offline status
    await prisma.agent.updateMany({
      data: { status: 'offline' },
    });

    await prisma.$disconnect();
    console.log('[Kernel] Shutdown complete. Goodbye! 👋');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', async (error) => {
    console.error('[Kernel] Uncaught exception:', error);
    await shutdown('uncaughtException');
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('[Kernel] Unhandled rejection:', reason);
    // Don't exit on unhandled rejection - log and continue
  });

  // Keep the process alive
  await new Promise(() => {
    // This promise never resolves - keeps process running
    // The only way out is SIGINT/SIGTERM
  });
}

// Run main with error handling
main().catch(async (error) => {
  console.error('❌ Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
