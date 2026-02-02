import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Cleaning up stuck tasks...\n');

  // Find tasks that have been in progress for more than 15 minutes
  const stuckTasks = await prisma.task.findMany({
    where: {
      status: { in: ['assigned', 'in_progress'] },
      OR: [{ startedAt: { lt: new Date(Date.now() - 15 * 60 * 1000) } }, { startedAt: null }],
    },
    include: { assignee: true },
  });

  console.log(`Found ${stuckTasks.length} stuck tasks:\n`);

  for (const task of stuckTasks) {
    const elapsed = task.startedAt
      ? Math.floor((Date.now() - task.startedAt.getTime()) / 1000 / 60)
      : 0;

    console.log(`  - ${task.title.substring(0, 50)} (${elapsed} min)`);

    // Reset task to inbox
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'inbox',
        assigneeId: null,
        startedAt: null,
        error:
          elapsed > 0
            ? `Task was stuck for ${elapsed} minutes and was reset`
            : 'Task was not started and reset',
      },
    });
  }

  // Reset all agents to idle
  const agents = await prisma.agent.updateMany({
    where: { status: { in: ['busy', 'working'] } },
    data: { status: 'idle', statusReason: 'Reset by cleanup script' },
  });

  console.log(`\n✅ Reset ${stuckTasks.length} tasks to inbox`);
  console.log(`✅ Reset ${agents.count} agents to idle\n`);

  await prisma.$disconnect();
}

main();
