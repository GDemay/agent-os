import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Resetting all blocked tasks to inbox...");
  
  const result = await prisma.task.updateMany({
    where: { status: 'blocked' },
    data: { 
      status: 'inbox',
      assigneeId: null,
      startedAt: null,
      error: null
    }
  });
  
  console.log(`Unblocked ${result.count} tasks.`);
  
  const counts = await prisma.task.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  console.log("\nTask counts:");
  for (const c of counts) {
    console.log(`  ${c.status}: ${c._count.status}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
