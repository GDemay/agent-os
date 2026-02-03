# AgentOS

> A self-improving autonomous development system with strategic product management.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/agent-os)

## What is AgentOS?

AgentOS is an event-driven autonomous development system. Four specialized AI agents coordinate through PostgreSQL to execute development tasks, conduct strategic analysis, and continuously improve the product.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your NVIDIA_NIM_API_KEY to .env

# Initialize database
npx prisma db push

# Seed agents
npm run seed

# Terminal 1: Start API & Dashboard
npm run api
# Visit http://localhost:3001/mission-control

# Terminal 2: Start Kernel
npm run kernel
```

## 🌐 Access Points

- **Mission Control Dashboard**: `http://localhost:3001/mission-control`
- **API Health**: `http://localhost:3001/api/health`
- **Old Dashboard**: `http://localhost:3001/dashboard`

## 🤖 Agents

### 💼 **Product Manager** (NEW!)
Strategic analyst focused on:
- 📊 Market research & competitive analysis
- 💰 Monetization strategy
- 🎨 UX improvements
- 📋 Strategic roadmaps & feature planning

### 🧠 **Orchestrator**
Breaks down high-level goals into actionable sub-tasks

### ⚡ **Worker**
Executes technical tasks using filesystem, shell, and git tools

### 🔍 **Reviewer**
Reviews completed work, validates quality, approves merges

## Architecture

```
Task Created
     ↓
Orchestrator → Breaks into sub-tasks
     ↓
Worker/Product Manager → Executes tasks
     ↓
Reviewer → Validates & approves
     ↓
Event Bus → Real-time coordination
     ↓
PostgreSQL → Single source of truth
```

## 📋 Common Commands

```bash
npm run kernel          # Start event-driven kernel
npm run api            # Start API server + dashboard
npm run check-tasks    # Check task status
npm run cleanup        # Reset stuck tasks
npm run add-product-agent  # Add Product Manager
```

## 🎯 CLI

```bash
agentos start                    # Start all agents
agentos task create "Build X"    # Create a new task
agentos task list                # List all tasks
agentos log                      # Stream activity log
agentos dashboard                # Open web dashboard
```

## � Deploy to Railway

Click the button above or follow the [Railway Deployment Guide](docs/RAILWAY_DEPLOYMENT.md).

**What you get:**
- ✅ Automatic PostgreSQL database provisioning
- ✅ Zero-config deployment
- ✅ Auto-scaling
- ✅ SSL/HTTPS by default
- ✅ Continuous deployment from GitHub
- ✅ Custom domain support

**Set these environment variables in Railway:**
- `NVIDIA_NIM_API_KEY` - Your NVIDIA NIM API key

Railway automatically sets `DATABASE_URL` and `PORT`.

## 📚 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and database schema
- [RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md) - Complete Railway deployment guide
- [QUICK_START_WITH_PRODUCT.md](docs/QUICK_START_WITH_PRODUCT.md) - Product Manager guide
- [TASK_RECOVERY.md](docs/TASK_RECOVERY.md) - Task timeout and recovery system
- [POC_SCOPE.md](POC_SCOPE.md) - PoC goals and success criteria
- [ORCHESTRATOR_SOUL.md](ORCHESTRATOR_SOUL.md) - Orchestrator agent personality
- [WORKER_SOUL.md](WORKER_SOUL.md) - Worker agent personality
- [REVIEWER_SOUL.md](REVIEWER_SOUL.md) - Reviewer agent personality

## Status

✅ **Production Ready** - Event-driven kernel with strategic product management.

## License

MIT
