import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Switching all agents to use tngtech/deepseek-r1t-chimera:free...\n");
  
  // Use a single model for all agents to simplify rate limiting
  await prisma.agent.updateMany({
    where: {},
    data: {
      modelConfig: {
        model: 'tngtech/deepseek-r1t-chimera:free',
        provider: 'openrouter',
        temperature: 0.3,
        reasoning: true
      }
    }
  });
  
  console.log("All agents updated to use DeepSeek R1T Chimera.\n");
  
  // Verify
  const agents = await prisma.agent.findMany();
  for (const a of agents) {
    const config = a.modelConfig as Record<string, unknown>;
    console.log(`${a.name}: ${config.model}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
