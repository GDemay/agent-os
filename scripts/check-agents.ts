import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.agent.findMany();
  console.log("=== Agent Configurations ===");
  for (const a of agents) {
    console.log(`\n${a.name} (${a.role}):`);
    console.log(`  Model Config: ${JSON.stringify(a.modelConfig)}`);
    console.log(`  Status: ${a.status}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
