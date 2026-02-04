import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const task = await prisma.task.create({
    data: {
      title: 'Test Timeout Fix - Create test-timeout.txt',
      description: 'Create a file named test-timeout.txt in the project root containing "Timeout fix test successful". This is a quick test to verify LLM timeout handling is working correctly.',
      status: 'inbox',
      priority: 10 // High priority
    }
  });
  console.log(`Created test task: ${task.id}`);
  console.log(`Title: ${task.title}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
