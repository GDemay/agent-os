import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("=== Recent Activities (last 20) ===");
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { agent: true, task: true }
  });
  
  for (const a of activities) {
    const time = a.createdAt.toISOString().split('T')[1].slice(0, 8);
    const agent = a.agent?.name || 'System';
    const task = a.task ? `[${a.task.title.slice(0, 30)}]` : '';
    console.log(`${time} | ${agent} | ${a.eventType} | ${a.message?.slice(0, 60) || ''} ${task}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
