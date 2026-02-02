# AgentOS

> A self-improving autonomous development system.

## What is AgentOS?

AgentOS is a minimal "kernel" that enables autonomous software development. Three AI agents (Orchestrator, Worker, Reviewer) coordinate through PostgreSQL to execute coding tasks and improve the system itself.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY)

# Initialize database
npx prisma db push

# Start the system
npm run start
```

## Architecture

```
Orchestrator (Planner) → Creates tasks, monitors progress
     ↓
Worker (Coder) → Executes tasks, writes code
     ↓
Reviewer (Judge) → Validates, approves, merges
     ↓
PostgreSQL → Single source of truth
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details.

## CLI

```bash
agentos start                    # Start all agents
agentos task create "Build X"    # Create a new task
agentos task list                # List all tasks
agentos log                      # Stream activity log
agentos dashboard                # Open web dashboard
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and database schema
- [POC_SCOPE.md](POC_SCOPE.md) - PoC goals and success criteria
- [ORCHESTRATOR_SOUL.md](ORCHESTRATOR_SOUL.md) - Orchestrator agent personality
- [WORKER_SOUL.md](WORKER_SOUL.md) - Worker agent personality
- [REVIEWER_SOUL.md](REVIEWER_SOUL.md) - Reviewer agent personality

## Status

🚧 **PoC in Development** - Building the self-improving kernel.

## License

MIT
