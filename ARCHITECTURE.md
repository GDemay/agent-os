# AgentOS Kernel Architecture

> A self-improving autonomous development system based on the Planner/Worker/Judge pattern.

## Overview

AgentOS is a minimal "kernel" that enables autonomous software development. The system can iterate on its own codebase, spawn new agents, and coordinate complex multi-step tasks.

**Inspirations:**
- [Mission Control](https://www.clawdbot.com/blog/mission-control) - Heartbeat system, shared state, agent personalities
- [Cursor's Scaling Autonomous Coding](https://www.cursor.com/blog/scaling-autonomous-coding) - Planner/Worker/Judge roles, recursive planning

---

## Core Principles

1. **Self-Improvement First**: The PoC must be able to modify and extend itself
2. **Simplicity Over Completeness**: Start with 3 agents, not 10
3. **Database as Truth**: PostgreSQL replaces file-based coordination (no locking issues)
4. **Cheap Models for Routine**: Use `gpt-4o-mini`/`haiku` for heartbeats, expensive models for planning/coding
5. **Independent Tasks**: Work is parallelizable; agents don't block each other

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AgentOS Kernel                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Orchestrator │    │    Worker    │    │   Reviewer   │      │
│  │   (Planner)   │    │   (Coder)    │    │   (Judge)    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│                    ┌────────▼────────┐                          │
│                    │   Message Bus   │                          │
│                    │  (PostgreSQL)   │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │               │
│  ┌──────▼───────┐   ┌───────▼──────┐   ┌───────▼──────┐        │
│  │    Tasks     │   │   Agents     │   │  Activities  │        │
│  │    Table     │   │    Table     │   │    Table     │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   CLI / API     │
                    │   Dashboard     │
                    └─────────────────┘
```

---

## Agent Roles

### 1. Orchestrator (Planner)

**Purpose**: Break down high-level goals into actionable tasks. Monitor system health.

**Capabilities**:
- Create/update tasks in database
- Spawn new Worker agents dynamically
- Monitor task progress and reassign stalled work
- Recursive sub-planning (spawn sub-orchestrators for complex areas)

**Heartbeat**: Every 5 minutes
- Check for new high-level goals
- Review blocked/stalled tasks
- Optimize task queue

**Model**: `deepseek-reasoner` (R1) - Optimized for complex planning

### 2. Worker (Coder)

**Purpose**: Execute tasks. Write code, create files, run commands.

**Capabilities**:
- File system access (read/write)
- Shell command execution
- Git operations (branch, commit, push)
- Web browsing (research, documentation)

**Heartbeat**: Every 2 minutes (when tasks are assigned)
- Pick up assigned task
- Execute until complete or blocked
- Push to feature branch
- Update task status

**Model**: `deepseek-chat` (V3) - Optimized for coding speed/cost

### 3. Reviewer (Judge)

**Purpose**: Validate work quality. Approve or reject before merge.

**Capabilities**:
- Pull and review branches
- Run tests
- Static analysis
- Approve/reject with feedback

**Heartbeat**: Every 5 minutes
- Check tasks in `review` status
- Pull branch, run tests
- If pass → merge to main
- If fail → send back to worker with feedback

**Model**: `deepseek-reasoner` (R1) - Optimized for logic/verification

---

## Database Schema (PostgreSQL)

```sql
-- Agents: The autonomous workers
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'orchestrator', 'worker', 'reviewer'
    status VARCHAR(20) DEFAULT 'idle', -- 'idle', 'active', 'blocked'
    session_key VARCHAR(100) UNIQUE,
    model VARCHAR(50) NOT NULL, -- 'gpt-4o', 'claude-3-5-sonnet', etc.
    capabilities JSONB DEFAULT '[]',
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks: Units of work
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'inbox', -- 'inbox', 'assigned', 'in_progress', 'review', 'done', 'blocked'
    priority INTEGER DEFAULT 0,
    assignee_id UUID REFERENCES agents(id),
    created_by UUID REFERENCES agents(id),
    parent_task_id UUID REFERENCES tasks(id),
    branch_name VARCHAR(200),
    result TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Messages: Agent communication
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id),
    from_agent_id UUID REFERENCES agents(id),
    to_agent_id UUID REFERENCES agents(id), -- NULL = broadcast
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'comment', -- 'comment', 'status', 'review', 'question', 'answer'
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities: Audit log of everything
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    agent_id UUID REFERENCES agents(id),
    task_id UUID REFERENCES tasks(id),
    message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Sessions: Track running processes
CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) NOT NULL,
    pid INTEGER,
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'stopped', 'crashed'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    stopped_at TIMESTAMPTZ,
    logs TEXT
);

-- Schedules: Cron-like heartbeats
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) NOT NULL,
    cron_expression VARCHAR(100) NOT NULL, -- e.g., '*/5 * * * *'
    enabled BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_messages_task ON messages(task_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
CREATE INDEX idx_schedules_next_run ON schedules(next_run) WHERE enabled = TRUE;
```

---

## Self-Improvement Loop

The critical capability: agents can modify their own codebase.

```
┌──────────────────────────────────────────────────────────────┐
│                    Self-Improvement Flow                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Orchestrator identifies improvement                      │
│     └── "Need a Twitter integration tool"                    │
│                                                              │
│  2. Orchestrator creates Task                                │
│     └── Task: "Implement TwitterTool class"                  │
│                                                              │
│  3. Worker picks up Task                                     │
│     └── Creates branch: feature/twitter-tool                 │
│     └── Writes code, commits, pushes                         │
│     └── Updates task status: 'review'                        │
│                                                              │
│  4. Reviewer validates                                       │
│     └── Pulls branch, runs tests                             │
│     └── If PASS: merge to main                               │
│     └── If FAIL: send back with feedback                     │
│                                                              │
│  5. Hot-reload (optional) or restart                         │
│     └── New capability now available                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## LLM Configuration

```yaml
# config/llm.yaml
providers:
  deepseek:
    api_key: ${DEEPSEEK_API_KEY}
    base_url: https://api.deepseek.com
    models:
      - deepseek-reasoner  # DeepSeek R1 (Planning/Reasoning)
      - deepseek-chat      # DeepSeek V3 (Coding/General)
  
  opencode: # Generic OpenAI-compatible provider (e.g. Kimi, Qwen, Local)
    api_key: ${OPENCODE_API_KEY}
    base_url: ${OPENCODE_BASE_URL}
    models:
      - moonshot-v1-8k  # Kimi
      - qwen-2.5-coder

# Role-based model assignment
roles:
  orchestrator:
    primary: deepseek-reasoner
    fallback: deepseek-chat
  
  worker:
    primary: deepseek-chat
    fallback: opencode/moonshot-v1-8k
  
  reviewer:
    primary: deepseek-reasoner
    fallback: deepseek-chat
  
  heartbeat:
    primary: deepseek-chat  # Extremely cheap
    fallback: opencode/moonshot-v1-8k

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Runtime | Node.js / TypeScript | Async-first, good LLM SDKs |
| Database | PostgreSQL | ACID, real-time with LISTEN/NOTIFY |
| ORM | Prisma | Type-safe, migrations |
| Agent Framework | Custom (inspired by OpenClaw) | Full control, no vendor lock |
| CLI | Commander.js | Quick to build |
| Dashboard | React + TailwindCSS | Agents build this later |
| Deployment | Railway / Docker | Simple, cheap |

---

## Directory Structure

```
agent-os/
├── src/
│   ├── agents/
│   │   ├── base.ts           # BaseAgent class
│   │   ├── orchestrator.ts   # Planner agent
│   │   ├── worker.ts         # Coder agent
│   │   └── reviewer.ts       # Judge agent
│   ├── tools/
│   │   ├── filesystem.ts     # Read/write files
│   │   ├── shell.ts          # Execute commands
│   │   ├── git.ts            # Git operations
│   │   ├── browser.ts        # Web browsing
│   │   └── database.ts       # Task/message CRUD
│   ├── llm/
│   │   ├── provider.ts       # LLM abstraction
│   │   ├── anthropic.ts      # Claude adapter
│   │   └── openai.ts         # GPT adapter
│   ├── scheduler/
│   │   ├── heartbeat.ts      # Cron-like scheduler
│   │   └── runner.ts         # Process manager
│   ├── db/
│   │   ├── schema.prisma     # Prisma schema
│   │   └── client.ts         # DB client
│   └── cli/
│       ├── index.ts          # CLI entry point
│       ├── agent.ts          # agent start/stop/status
│       ├── task.ts           # task create/list/update
│       └── dashboard.ts      # Open dashboard
├── dashboard/                # React frontend (Phase 2)
├── config/
│   └── llm.yaml
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
└── README.md
```

---

## CLI Interface

```bash
# Start the system
agentos start                    # Start all agents
agentos start orchestrator       # Start specific agent

# Manage agents
agentos agent list               # Show all agents
agentos agent create worker-2    # Create new worker
agentos agent status             # Show heartbeat status

# Manage tasks
agentos task create "Build login page" --assign worker
agentos task list --status in_progress
agentos task show <id>

# View activity
agentos log                      # Stream activity log
agentos log --agent orchestrator # Filter by agent

# Dashboard
agentos dashboard                # Open web dashboard
```

---

## Dashboard (Jira-like Board)

The dashboard shows real-time agent activity:

```
┌─────────────────────────────────────────────────────────────────┐
│  AgentOS Mission Control                          [+ New Task]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Agents Online: 3/3                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Orchestrator│ │   Worker    │ │  Reviewer   │               │
│  │   ● Active  │ │   ● Active  │ │   ○ Idle    │               │
│  │ Last: 2m ago│ │ Last: 30s   │ │ Last: 5m    │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Task Board                                                     │
│                                                                 │
│  INBOX      │ IN PROGRESS │ REVIEW      │ DONE                  │
│  ─────────  │ ───────────  │ ──────────  │ ────                  │
│  ┌────────┐ │ ┌──────────┐ │ ┌────────┐ │ ┌────────┐            │
│  │Task #4 │ │ │Task #2   │ │ │Task #1 │ │ │Task #0 │            │
│  │Add API │ │ │Login Page│ │ │DB Setup│ │ │Init    │            │
│  │        │ │ │Worker    │ │ │Worker  │ │ │        │            │
│  └────────┘ │ └──────────┘ │ └────────┘ │ └────────┘            │
│             │              │            │                       │
├─────────────────────────────────────────────────────────────────┤
│  Activity Feed                                                  │
│                                                                 │
│  [12:34:56] Worker started task "Login Page"                    │
│  [12:34:45] Orchestrator created task "Add API endpoints"       │
│  [12:34:30] Reviewer approved task "DB Setup" → merged          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What This System Can Do

Once the PoC is complete, the system can:

1. **Develop itself**: Create new tools, fix bugs, add features
2. **Build fullstack apps**: Frontend, backend, database, deployment
3. **Coordinate autonomously**: No human intervention for routine work
4. **Scale horizontally**: Spawn more workers for parallelism
5. **Learn from failures**: Reviewer feedback improves worker output

---

## What's Out of Scope (For Now)

- Multi-tenant SaaS (single-user first)
- Fancy UI (CLI is enough to start)
- Production deployment (local dev first)
- Billing/payments (no customers yet)
- 10 agent types (3 is enough for PoC)

---

## Success Criteria

The PoC is successful when:

- [ ] Orchestrator can create tasks from a high-level goal
- [ ] Worker can execute a coding task end-to-end
- [ ] Reviewer can approve/reject and trigger merge
- [ ] System can modify its own codebase (self-improvement)
- [ ] Dashboard shows real-time agent activity
- [ ] All communication happens through PostgreSQL (no file locks)
