# 🚀 Quick Start Guide - AgentOS with Product Manager

## Access Points

### 1. **Mission Control Dashboard** (Interactive UI)
```bash
# Terminal 1: Start API server
npm run api

# Then open browser:
http://localhost:3001/mission-control
```

**What you can do:**
- ✅ Click task cards to see details
- ✅ Change task status (inbox → assigned → in_progress → review → done)
- ✅ Assign tasks to agents
- ✅ Delete tasks
- ✅ Click agents to see profiles
- ✅ Send messages to agents
- ✅ Create new tasks with "+ New Task"
- ✅ Broadcast messages to all agents

### 2. **Event-Driven Kernel** (Task Processing)
```bash
# Terminal 2: Start kernel
npm run kernel
```

**What it does:**
- ⚡ Processes tasks immediately when created
- ⚡ Auto-assigns work to agents
- ⚡ Runs recovery watchdog every 2 minutes
- ⚡ Resets stuck tasks after 15 minutes

## Agents

### 💼 **Product Manager** (NEW!)
**Focus:** Strategy, monetization, UX, market research

**What it does:**
- 📊 Analyzes product viability and market fit
- 🔍 Researches competitors and trends (websearch)
- 💰 Identifies monetization opportunities
- 🎨 Proposes UX improvements
- 📋 Creates strategic roadmaps
- ✂️ Breaks goals into actionable tasks

**Assign tasks with tags:** `product`, `strategy`, `monetization`, `ux`, `research`

### 🧠 **Orchestrator**
Breaks down high-level goals into sub-tasks

### ⚡ **Worker**
Executes technical tasks (code, shell, git)

### 🔍 **Reviewer**
Reviews completed work and approves merges

## Common Commands

```bash
# Check task status
npm run check-tasks

# Clean up stuck tasks
npm run cleanup

# Start API server
npm run api

# Start kernel
npm run kernel

# Add Product Manager (if not exists)
npm run add-product-agent
```

## Example Workflow

### 1. **Create a Strategic Task**
Via Mission Control UI:
1. Click "+ New Task"
2. Title: "Research competitor pricing models"
3. Description: "Analyze what competitors charge for similar tools"
4. Tags: `product, research, monetization`
5. Assign to: Product Manager
6. Priority: High
7. Click "Create Task"

### 2. **Product Manager Works**
The kernel will:
1. Assign task to Product Manager
2. PM uses websearch to research competitors
3. PM analyzes findings
4. PM creates sub-tasks with recommendations
5. Marks analysis as complete

### 3. **Monitor Progress**
In Mission Control:
- See task move through: assigned → in_progress → review
- Click task to see Product Manager's analysis
- View created sub-tasks
- Read research findings in messages

## Pre-Created Strategic Task

There's already a high-priority strategic task assigned:

**"AgentOS: Initial Product Strategy Analysis"**
- Market analysis of autonomous agents
- Monetization strategy research
- UX improvements for Mission Control
- Growth and go-to-market plan
- 30/60/90 day roadmap

**To run it:**
```bash
# Make sure API is running
npm run api

# Start kernel (in new terminal)
npm run kernel
```

The Product Manager will automatically start analyzing!

## Tips

1. **Tag your tasks** - Use tags like `product`, `strategy`, `ux`, `monetization` to help route work
2. **Set priority** - High priority (8-10) tasks get processed first
3. **Watch the logs** - Kernel shows what Product Manager is researching and creating
4. **Check the dashboard** - See real-time updates as tasks move through the board
5. **Let it run** - Strategic analysis takes time (uses websearch, creates sub-tasks)

## Troubleshooting

**Tasks stuck?**
```bash
npm run cleanup
```

**Agents offline?**
```bash
# Make sure kernel is running
npm run kernel
```

**Can't see dashboard?**
```bash
# Make sure API is running
npm run api
# Then visit http://localhost:3001/mission-control
```

## What's Next

The Product Manager will:
1. ✅ Complete initial strategic analysis
2. 📊 Create market research report
3. 💰 Propose monetization features
4. 🎨 Suggest UX improvements
5. 📋 Generate 30/60/90 day roadmap
6. ✂️ Break into specific engineering tasks

All automatically! Just keep the kernel running.
