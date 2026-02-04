import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("=== Blocked Tasks with Errors ===");
  const tasks = await prisma.task.findMany({
    where: { status: 'blocked' },
    orderBy: { updatedAt: 'desc' },
    take: 10
  });
  
  for (const t of tasks) {
    console.log(`\n[${t.status}] ${t.title}`);
    console.log(`Error: ${t.error || 'No error message'}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
