import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Resetting all stuck tasks...");
  
  // Reset all in_progress and assigned tasks back to inbox
  const result = await prisma.task.updateMany({
    where: { 
      status: { in: ['in_progress', 'assigned'] }
    },
    data: { 
      status: 'inbox',
      assigneeId: null,
      startedAt: null,
      error: 'Reset after timeout fix deployment'
    }
  });
  
  console.log(`Reset ${result.count} stuck tasks to inbox status.`);
  
  // Reset all agents to idle
  await prisma.agent.updateMany({
    where: {},
    data: { status: 'idle' }
  });
  console.log("All agents set to idle.");
  
  // Show current state
  const taskCounts = await prisma.task.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  console.log("\n=== New Task Status Counts ===");
  for (const t of taskCounts) {
    console.log(`${t.status}: ${t._count.status}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
