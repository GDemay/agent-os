import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("=== Task Status Counts ===");
  const taskCounts = await prisma.task.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  for (const t of taskCounts) {
    console.log(`${t.status}: ${t._count.status}`);
  }
  
  console.log("\n=== In Progress/Assigned Tasks ===");
  const stuckTasks = await prisma.task.findMany({
    where: { status: { in: ['in_progress', 'assigned'] } },
    select: { id: true, title: true, status: true, startedAt: true, updatedAt: true, error: true },
    orderBy: { updatedAt: 'desc' },
    take: 10
  });
  if (stuckTasks.length === 0) {
    console.log("No stuck tasks found.");
  }
  for (const t of stuckTasks) {
    console.log(`[${t.status}] ${t.title.substring(0, 50)} | Started: ${t.startedAt || 'N/A'} | Error: ${t.error?.substring(0, 30) || 'None'}`);
  }
  
  console.log("\n=== Agent Status ===");
  const agents = await prisma.agent.findMany({
    select: { name: true, role: true, status: true, lastHeartbeat: true }
  });
  for (const a of agents) {
    console.log(`${a.name} (${a.role}): ${a.status} | Last heartbeat: ${a.lastHeartbeat || 'Never'}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
