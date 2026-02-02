import { PrismaClient, Agent, Task } from '@prisma/client';
import { BaseAgent } from './BaseAgent';

/**
 * ProductAgent - Strategic product and business analyst
 *
 * Responsibilities:
 * - Analyze product viability and market fit
 * - Research competitors and industry trends
 * - Identify monetization opportunities
 * - Improve user experience through research
 * - Create strategic roadmaps and feature suggestions
 * - Break down strategic goals into actionable tasks
 *
 * Focus Areas:
 * - Product-market fit
 * - Revenue opportunities
 * - User experience improvements
 * - Market research and competitive analysis
 * - Growth strategies
 */
export class ProductAgent extends BaseAgent {
  private currentTask: Task | null = null;
  private maxIterations = 15; // More iterations for research tasks

  constructor(prisma: PrismaClient, agentRecord: Agent) {
    super(prisma, agentRecord);
  }

  /**
   * Process a product/strategy task immediately
   */
  async processTask(task: Task): Promise<void> {
    await this.updateStatus('busy');
    this.currentTask = task;

    try {
      if (task.status === 'assigned') {
        await this.analyzeAndExecute(task);
      } else if (task.status === 'in_progress') {
        await this.continueAnalysis(task);
      }
    } catch (error) {
      await this.logActivity('error', `Product analysis error: ${error}`, task.id);
    }

    await this.updateStatus('idle');
  }

  /**
   * Heartbeat - check for product strategy tasks
   */
  async heartbeat(): Promise<void> {
    await this.updateStatus('busy');

    try {
      // Look for product/strategy tagged tasks
      const strategicTask = await this.prisma.task.findFirst({
        where: {
          assigneeId: this.agentRecord.id,
          status: { in: ['assigned', 'in_progress'] },
          OR: [
            { tags: { array_contains: ['product'] } },
            { tags: { array_contains: ['strategy'] } },
            { tags: { array_contains: ['monetization'] } },
            { tags: { array_contains: ['ux'] } },
            { tags: { array_contains: ['research'] } },
          ],
        },
      });

      if (strategicTask) {
        this.currentTask = strategicTask;
        if (strategicTask.status === 'assigned') {
          await this.analyzeAndExecute(strategicTask);
        } else {
          await this.continueAnalysis(strategicTask);
        }
        return;
      }

      // If no tasks, create a strategic analysis task
      await this.proposeStrategicInitiatives();
    } catch (error) {
      await this.logActivity('error', `Heartbeat error: ${error}`);
    } finally {
      await this.updateStatus('idle');
    }
  }

  /**
   * Analyze task and create execution plan
   */
  private async analyzeAndExecute(task: Task): Promise<void> {
    await this.logActivity('task_started', `Analyzing: ${task.title}`, task.id);

    // Mark task as in progress
    await this.prisma.task.update({
      where: { id: task.id },
      data: { status: 'in_progress', startedAt: new Date() },
    });

    // Build strategic analysis prompt
    const prompt = this.buildAnalysisPrompt(task);

    let iteration = 0;
    let isComplete = false;

    while (iteration < this.maxIterations && !isComplete) {
      iteration++;
      await this.logActivity(
        'reasoning',
        `Strategic iteration ${iteration}/${this.maxIterations}`,
        task.id,
      );

      try {
        const response = await this.think(prompt);

        const content = response.content;
        if (!content) {
          await this.logActivity('error', 'Empty LLM response', task.id);
          break;
        }

        // Parse tool calls and actions
        const actions = this.parseProductActions(content);

        if (actions.createSubtasks && actions.createSubtasks.length > 0) {
          await this.createStrategicSubtasks(task, actions.createSubtasks);
        }

        if (actions.research && actions.research.length > 0) {
          await this.conductResearch(task, actions.research);
        }

        if (actions.complete) {
          await this.completeTask(task, content);
          isComplete = true;
        }

        // Add reasoning to task messages
        await this.sendMessage(content, undefined, task.id);
      } catch (error) {
        await this.logActivity('error', `Analysis iteration failed: ${error}`, task.id);
        break;
      }
    }

    if (!isComplete && iteration >= this.maxIterations) {
      await this.markTaskBlocked(task, 'Max strategic iterations reached - needs refinement');
    }
  }

  /**
   * Continue an in-progress analysis
   */
  private async continueAnalysis(task: Task): Promise<void> {
    await this.logActivity(
      'task_continued',
      `Continuing strategic analysis: ${task.title}`,
      task.id,
    );
    await this.analyzeAndExecute(task);
  }

  /**
   * Build the analysis prompt
   */
  private buildAnalysisPrompt(task: Task): string {
    return `
You are a Product Manager analyzing this strategic goal:

**Goal:** ${task.title}
**Description:** ${task.description || 'No additional details'}
**Priority:** ${task.priority >= 8 ? 'HIGH' : task.priority >= 5 ? 'MEDIUM' : 'NORMAL'}

Your mission is to:
1. **Analyze** the product/market viability
2. **Research** competitors, trends, and opportunities (use websearch tool)
3. **Identify** monetization strategies
4. **Propose** UX improvements and growth tactics
5. **Break down** into actionable sub-tasks with clear owners

Available tools:
- websearch: Research market trends, competitors, best practices
- database: Check existing features, user data, metrics
- filesystem: Read current product docs, code, configs

Output your analysis in this format:

## Strategic Analysis
[Your market/competitive/viability analysis]

## Monetization Opportunities
[Revenue strategies and pricing models]

## UX Improvements
[User experience enhancements]

## Research Findings
[Key insights from online research]

## Recommended Actions
1. [Action item with owner and priority]
2. [Action item with owner and priority]

## Sub-Tasks
- Title: [Task name]
  Description: [What needs to be done]
  Tags: [product, ux, monetization, etc]
  Priority: [0-10]

When complete, respond with: **STRATEGIC_ANALYSIS_COMPLETE**
`;
  }

  /**
   * Product Agent system prompt
   */
  private getProductAgentSystemPrompt(): string {
    return `You are a strategic Product Manager and Business Analyst for AgentOS.

Your core responsibilities:
- Ensure product-market fit and viability
- Identify revenue opportunities and growth strategies
- Improve user experience through research and analysis
- Conduct competitive analysis and market research
- Break down strategic goals into actionable tasks
- Focus on what makes the product valuable and profitable

Key principles:
- Always validate assumptions with research
- Think about monetization and sustainability
- Prioritize user value and experience
- Base decisions on data and market insights
- Create clear, actionable roadmaps

Tools at your disposal:
- websearch: For market research, competitor analysis, trends
- database: For analyzing existing features and metrics
- filesystem: For reviewing product documentation

Be strategic, data-driven, and user-focused in all your analysis.`;
  }

  /**
   * Parse product actions from LLM response
   */
  private parseProductActions(content: string): {
    createSubtasks?: Array<{
      title: string;
      description: string;
      tags: string[];
      priority: number;
    }>;
    research?: string[];
    complete?: boolean;
  } {
    const actions: any = {};

    // Check for completion
    if (content.includes('STRATEGIC_ANALYSIS_COMPLETE')) {
      actions.complete = true;
    }

    // Parse subtasks
    const subtaskMatches = content.match(/## Sub-Tasks([\s\S]*?)(?=##|$)/);
    if (subtaskMatches) {
      const subtasksText = subtaskMatches[1];
      const taskBlocks = subtasksText.split(/- Title:/).slice(1);

      actions.createSubtasks = taskBlocks.map((block) => {
        const title = block.match(/^(.+)/)?.[1]?.trim() || 'Untitled Task';
        const desc = block.match(/Description: (.+)/)?.[1]?.trim() || '';
        const tagsMatch = block.match(/Tags: \[(.+)\]/)?.[1];
        const tags = tagsMatch ? tagsMatch.split(',').map((t) => t.trim()) : ['product'];
        const priority = parseInt(block.match(/Priority: (\d+)/)?.[1] || '5');

        return { title, description: desc, tags, priority };
      });
    }

    // Parse research queries
    const researchMatches = content.match(/RESEARCH: (.+)/g);
    if (researchMatches) {
      actions.research = researchMatches.map((m) => m.replace('RESEARCH: ', '').trim());
    }

    return actions;
  }

  /**
   * Create strategic sub-tasks
   */
  private async createStrategicSubtasks(
    parentTask: Task,
    subtasks: Array<{ title: string; description: string; tags: string[]; priority: number }>,
  ): Promise<void> {
    await this.logActivity(
      'subtasks_created',
      `Creating ${subtasks.length} strategic sub-tasks`,
      parentTask.id,
    );

    for (const subtask of subtasks) {
      await this.prisma.task.create({
        data: {
          title: subtask.title,
          description: subtask.description,
          status: 'inbox',
          priority: subtask.priority,
          tags: subtask.tags,
          parentTaskId: parentTask.id,
          createdById: this.agentRecord.id,
        },
      });
    }

    await this.sendMessage(
      `✅ Created ${subtasks.length} strategic sub-tasks for execution`,
      undefined,
      parentTask.id,
    );
  }

  /**
   * Conduct market research
   */
  private async conductResearch(task: Task, queries: string[]): Promise<void> {
    await this.logActivity('research_started', `Researching ${queries.length} topics`, task.id);

    for (const query of queries) {
      try {
        const tool = this.tools.get('websearch');
        if (tool) {
          const result = await tool.execute({ query });
          await this.sendMessage(
            `📊 Research: ${query}\n\nFindings: ${JSON.stringify(result).substring(0, 500)}...`,
            undefined,
            task.id,
          );
        }
      } catch (error) {
        await this.logActivity('error', `Research failed for "${query}": ${error}`, task.id);
      }
    }
  }

  /**
   * Complete the strategic analysis task
   */
  private async completeTask(task: Task, analysis: string): Promise<void> {
    await this.prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'review',
        result: analysis,
        completedAt: new Date(),
      },
    });

    await this.logActivity('task_completed', `Strategic analysis complete: ${task.title}`, task.id);
    await this.sendMessage(
      '✅ Strategic analysis complete and ready for review',
      undefined,
      task.id,
    );

    this.currentTask = null;
  }

  /**
   * Mark task as blocked
   */
  private async markTaskBlocked(task: Task, reason: string): Promise<void> {
    await this.prisma.task.update({
      where: { id: task.id },
      data: { status: 'blocked', error: reason },
    });

    await this.logActivity('task_blocked', reason, task.id);
    await this.sendMessage(`⚠️ Task blocked: ${reason}`, undefined, task.id);
  }

  /**
   * Propose strategic initiatives periodically
   */
  private async proposeStrategicInitiatives(): Promise<void> {
    // Check if we recently created a strategic task
    const recentStrategicTask = await this.prisma.task.findFirst({
      where: {
        createdById: this.agentRecord.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h
      },
    });

    if (recentStrategicTask) {
      await this.updateStatus('idle');
      return;
    }

    // Create a periodic strategic review task
    await this.prisma.task.create({
      data: {
        title: 'Weekly Product Strategy Review',
        description: `Analyze:
- Current product metrics and user feedback
- Competitor landscape and market trends
- Revenue opportunities and growth strategies
- UX improvements and feature requests
- Strategic priorities for next sprint`,
        status: 'inbox',
        priority: 7,
        tags: ['product', 'strategy', 'research'],
        createdById: this.agentRecord.id,
      },
    });

    await this.logActivity('initiative_created', 'Created weekly strategic review task');
  }
}
