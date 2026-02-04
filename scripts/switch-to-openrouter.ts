import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Switching all agents to OpenRouter with optimized models...\n");
  
  // Get agent IDs first
  const agents = await prisma.agent.findMany();
  const agentMap = new Map(agents.map(a => [a.name, a.id]));
  
  // Orchestrator - uses reasoning model for planning
  await prisma.agent.update({
    where: { id: agentMap.get('Orchestrator') },
    data: {
      modelConfig: {
        model: 'tngtech/deepseek-r1t-chimera:free',
        provider: 'openrouter',
        temperature: 0.6,
        reasoning: true
      }
    }
  });
  console.log("✓ Orchestrator → tngtech/deepseek-r1t-chimera:free (reasoning/planning)");
  
  // Reviewer - uses reasoning model for judgment
  await prisma.agent.update({
    where: { id: agentMap.get('Reviewer') },
    data: {
      modelConfig: {
        model: 'tngtech/deepseek-r1t-chimera:free',
        provider: 'openrouter',
        temperature: 0.3,
        reasoning: true
      }
    }
  });
  console.log("✓ Reviewer → tngtech/deepseek-r1t-chimera:free (reasoning/judgment)");
  
  // Worker - uses coding model
  await prisma.agent.update({
    where: { id: agentMap.get('Worker') },
    data: {
      modelConfig: {
        model: 'qwen/qwen3-coder:free',
        provider: 'openrouter',
        temperature: 0.2
      }
    }
  });
  console.log("✓ Worker → qwen/qwen3-coder:free (coding)");
  
  // Product Manager - uses general purpose model
  await prisma.agent.update({
    where: { id: agentMap.get('Product Manager') },
    data: {
      modelConfig: {
        model: 'openai/gpt-oss-120b:free',
        provider: 'openrouter',
        temperature: 0.7,
        max_tokens: 4000
      }
    }
  });
  console.log("✓ Product Manager → openai/gpt-oss-120b:free (general/strategy)");
  
  // Verify
  console.log("\n=== Updated Agent Configurations ===");
  const updatedAgents = await prisma.agent.findMany();
  for (const a of updatedAgents) {
    const config = a.modelConfig as Record<string, unknown>;
    console.log(`${a.name} (${a.role}): ${config.model}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
