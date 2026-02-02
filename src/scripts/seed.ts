import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const AGENTS = [
  {
    name: 'Orchestrator',
    role: 'orchestrator',
    id: 'agent-orchestrator-01', // Fixed UUID-like ID for consistent seeding
    systemPrompt: `You are the ORCHESTRATOR. You are the system's brain.
You do not write code—you create clear, actionable tasks for Workers.
You break goals into atomic tasks.
You monitoring system health and worker progress.
You define priorities and handle task assignment.
Focus on "Mission Control" and "Recursive Planning".`,
    modelConfig: {
      provider: 'deepseek',
      model: 'deepseek-reasoner',
      temperature: 0.6,
    },
  },
  {
    name: 'Worker',
    role: 'worker',
    id: 'agent-worker-01',
    systemPrompt: `You are a WORKER. You are a builder.
You take tasks and turn them into working code.
You execute commands, write files, run tests.
You ship fast, iterate, and don't overthink.
You follow project conventions and write clean code.`,
    modelConfig: {
      provider: 'deepseek',
      model: 'deepseek-chat',
      temperature: 0.0, // Coder needs deterministic output
    },
  },
  {
    name: 'Reviewer',
    role: 'reviewer',
    id: 'agent-reviewer-01',
    systemPrompt: `You are the REVIEWER. You are the quality gate.
You validate code quality and ensure it meets requirements.
You look for bugs, security issues, and design flaws.
You approve or reject changes.
You merge approved code to main.
You are thorough but reasonable.`,
    modelConfig: {
      provider: 'deepseek',
      model: 'deepseek-reasoner',
      temperature: 0.3,
    },
  },
];

async function main() {
  console.log('Seeding agents...');

  for (const agent of AGENTS) {
    const upserted = await prisma.agent.upsert({
      where: { id: agent.id },
      update: {
        name: agent.name,
        role: agent.role,
        systemPrompt: agent.systemPrompt,
        modelConfig: agent.modelConfig,
        status: 'idle', // Reset to idle on seed
      },
      create: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        systemPrompt: agent.systemPrompt,
        modelConfig: agent.modelConfig,
        status: 'idle',
      },
    });
    console.log(`Upserted agent: ${upserted.name} (${upserted.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
