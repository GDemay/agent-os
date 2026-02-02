import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding Product Manager agent...');

  // Check if product agent already exists
  const existing = await prisma.agent.findFirst({
    where: { role: 'product' },
  });

  if (existing) {
    console.log('✅ Product Manager agent already exists:', existing.name);
    return;
  }

  // Create Product Manager agent
  const productAgent = await prisma.agent.create({
    data: {
      id: 'agent-product-01',
      name: 'Product Manager',
      role: 'product',
      roleType: 'lead',
      avatar: '💼',
      about:
        'Strategic product and business analyst focused on market fit, monetization, and user experience. Researches competitors, identifies revenue opportunities, and creates actionable roadmaps.',
      skills: [
        'Market Research',
        'Competitive Analysis',
        'Monetization Strategy',
        'User Experience',
        'Product Strategy',
        'Growth Hacking',
        'Data Analysis',
        'Business Development',
      ],
      status: 'idle',
      systemPrompt: `You are a strategic Product Manager and Business Analyst.

Your mission: Ensure AgentOS is viable, profitable, and user-focused.

Core responsibilities:
- Analyze product-market fit and viability
- Research competitors and industry trends
- Identify monetization opportunities
- Improve user experience through research
- Create strategic roadmaps and break down into tasks
- Focus on what makes the product valuable and profitable

Always:
- Validate assumptions with research (use websearch)
- Think about monetization and sustainability
- Prioritize user value and experience
- Base decisions on data and market insights
- Create clear, actionable roadmaps

Tools available:
- websearch: Market research, competitor analysis, trends
- database: Analyze existing features and metrics
- filesystem: Review product documentation

Be strategic, data-driven, and user-focused.`,
      modelConfig: {
        model: 'deepseek-chat',
        temperature: 0.7,
        max_tokens: 4000,
      },
    },
  });

  console.log('✅ Created Product Manager agent:', productAgent.name);
  console.log('   ID:', productAgent.id);
  console.log('   Role:', productAgent.role);
  console.log('   Avatar:', productAgent.avatar);
  console.log('\n📋 This agent will:');
  console.log('   - Analyze product viability and market fit');
  console.log('   - Research competitors and trends');
  console.log('   - Identify monetization opportunities');
  console.log('   - Improve UX through research');
  console.log('   - Create strategic roadmaps');
  console.log('   - Break down strategic goals into tasks');

  // Create initial strategic analysis task
  const initialTask = await prisma.task.create({
    data: {
      title: 'AgentOS: Initial Product Strategy Analysis',
      description: `Conduct a comprehensive strategic analysis of AgentOS:

1. **Market Analysis**
   - Research autonomous agent systems and competitors
   - Identify market gaps and opportunities
   - Analyze target audience and use cases

2. **Monetization Strategy**
   - Evaluate pricing models (SaaS, usage-based, enterprise)
   - Identify premium features and upsell opportunities
   - Research what competitors charge

3. **User Experience**
   - Analyze current UI/UX (Mission Control dashboard)
   - Identify friction points and improvements
   - Research best practices in dev tools

4. **Growth Strategy**
   - Define go-to-market approach
   - Identify marketing channels
   - Plan content and positioning

5. **Action Plan**
   - Break down into specific, actionable tasks
   - Assign priorities and owners
   - Create 30/60/90 day roadmap`,
      status: 'assigned',
      priority: 10,
      tags: ['product', 'strategy', 'research', 'monetization', 'ux'],
      assigneeId: productAgent.id,
    },
  });

  console.log('\n🎯 Created initial strategic task:', initialTask.title);
  console.log('   Priority: HIGH (10)');
  console.log('   Status: assigned');
  console.log('\n💡 Run "npm run kernel" to start the product analysis!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
