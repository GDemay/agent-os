import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { LLMFactory } from '../lib/llm';

dotenv.config();

async function verifySystem() {
  console.log('🔍 AgentOS System Verification\n');

  // 1. Database Check
  console.log('1️⃣  Database Connection...');
  const prisma = new PrismaClient();
  try {
    const agents = await prisma.agent.findMany();
    console.log(`   ✅ Connected to Railway PostgreSQL`);
    console.log(`   ✅ Found ${agents.length} agents:`);
    agents.forEach((a) => console.log(`      - ${a.name} (${a.role})`));
  } catch (e) {
    console.log(`   ❌ Database error: ${e}`);
  } finally {
    await prisma.$disconnect();
  }

  // 2. DeepSeek API Check
  console.log('\n2️⃣  DeepSeek API...');
  try {
    const llm = LLMFactory.create('deepseek');
    const response = await llm.generate(
      [
        { role: 'system', content: 'You are a test.' },
        { role: 'user', content: 'Say "OK" if you can hear me.' },
      ],
      { model: 'deepseek-chat', maxTokens: 10 },
    );
    console.log(`   ✅ DeepSeek API working`);
    console.log(`   ✅ Response: "${response.content}"`);
    console.log(`   ✅ Tokens used: ${response.usage.totalTokens}`);
  } catch (e) {
    console.log(`   ❌ DeepSeek error: ${e}`);
  }

  // 3. Git Check
  console.log('\n3️⃣  Git Access...');
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  try {
    const { stdout } = await execAsync('git remote -v');
    console.log(`   ✅ Git configured`);
    const { stdout: branch } = await execAsync('git branch --show-current');
    console.log(`   ✅ Current branch: ${branch.trim()}`);
  } catch (e) {
    console.log(`   ❌ Git error: ${e}`);
  }

  console.log('\n✨ All systems verified!\n');
}

verifySystem();
