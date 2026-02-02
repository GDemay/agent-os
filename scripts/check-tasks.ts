import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    where: { status: { in: ['assigned', 'in_progress'] } },
    include: { assignee: { select: { name: true, role: true, status: true } } },
    orderBy: { startedAt: 'asc' },
  });

  console.log('\n=== ACTIVE TASKS ===');
  tasks.forEach((t) => {
    const started = t.startedAt ? new Date(t.startedAt) : null;
    const elapsed = started ? Math.floor((Date.now() - started.getTime()) / 1000 / 60) : 0;
    console.log(`
Task: ${t.title.substring(0, 60)}
Status: ${t.status}
Assignee: ${t.assignee?.name || 'None'} (${t.assignee?.status || 'N/A'})
Started: ${started ? started.toLocaleString() : 'Not started'}
Elapsed: ${elapsed} minutes
Branch: ${t.branchName || 'None'}
---`);
  });

  console.log(`\nTotal stuck tasks: ${tasks.length}`);

  const agents = await prisma.agent.findMany();
  console.log('\n=== AGENT STATUS ===');
  agents.forEach((a) => {
    console.log(`${a.name}: ${a.status} (last heartbeat: ${a.lastHeartbeat || 'never'})`);
  });

  await prisma.$disconnect();
}

main();
