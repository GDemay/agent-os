import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Switching all agents to DeepSeek provider...");
  
  await prisma.agent.updateMany({
    where: {},
    data: {
      modelConfig: {
        model: 'deepseek-chat',
        provider: 'deepseek',
        temperature: 0.3
      }
    }
  });
  
  console.log("All agents updated. Verifying...");
  const agents = await prisma.agent.findMany();
  for (const a of agents) {
    console.log(`${a.name}: ${JSON.stringify(a.modelConfig)}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
