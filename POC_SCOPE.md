# AgentOS PoC - Scope & Success Criteria

> Build the minimal kernel that can iterate on itself.

## Goal

Create a self-improving autonomous development system with 3 core agents (Orchestrator, Worker, Reviewer) that coordinate through PostgreSQL.

**Timeline**: 1-2 weeks to working PoC

---

## What We're Building

### Phase 1: Foundation (Days 1-3)
- [ ] Project setup (Node.js + TypeScript + Prisma)
- [ ] PostgreSQL schema (tasks, agents, messages, activities)
- [ ] LLM provider abstraction (Anthropic + OpenAI)
- [ ] Base agent class with tool access

### Phase 2: Agents (Days 4-6)
- [ ] Orchestrator agent (creates tasks, monitors progress)
- [ ] Worker agent (executes coding tasks)
- [ ] Reviewer agent (validates and merges)
- [ ] Heartbeat scheduler (cron-like wakeups)

### Phase 3: Tools (Days 7-8)
- [ ] FileSystem tool (read/write files)
- [ ] Shell tool (execute commands)
- [ ] Git tool (branch, commit, push, merge)
- [ ] Database tool (task/message CRUD)

### Phase 4: CLI & Dashboard (Days 9-10)
- [ ] CLI interface (start, stop, task create, logs)
- [ ] Basic dashboard (Jira-like board, agent status, activity feed)

### Phase 5: Self-Improvement Test (Days 11-14)
- [ ] Give the system a task: "Add a new tool"
- [ ] Verify it creates branch, writes code, tests, merges
- [ ] System has new capability without manual intervention

---

## Success Criteria

| Criterion | Description |
|-----------|-------------|
| **Self-Modification** | System can add a new tool to its own codebase |
| **Task Lifecycle** | Task flows from inbox → assigned → in_progress → review → done |
| **Agent Coordination** | Orchestrator creates task, Worker executes, Reviewer validates |
| **Persistence** | All state in PostgreSQL, survives restarts |
| **Visibility** | Dashboard shows what agents are doing in real-time |
| **Cost Efficient** | Heartbeats use cheap models (`gpt-4o-mini`) |

---

## Out of Scope

| Not Now | Why |
|---------|-----|
| Multi-tenant | Single-user is enough for PoC |
| Production deploy | Local dev first |
| 10+ agents | 3 agents prove the pattern |
| Fancy UI | Basic Jira-like board is enough |
| External integrations | Slack, Discord, etc. come later |
| Marketing/Sales features | Focus on the kernel |

---

## Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | TypeScript | Type safety, good LLM SDKs |
| Database | PostgreSQL | ACID, LISTEN/NOTIFY for real-time |
| ORM | Prisma | Type-safe, easy migrations |
| LLM | Claude + GPT | Best coding models available |
| Frontend | React + Tailwind | Simple, agents can iterate on it |
| Deploy | Docker + Railway | Cheap, works with provided DB |

---

## Database

**Connection**: `postgresql://postgres:yQjxfUTZnLwTmeoEbhuEEkCIbPqJDmaZ@metro.proxy.rlwy.net:51350/railway`

Tables:
- `agents` - The 3 core agents
- `tasks` - Units of work
- `messages` - Agent communication
- `activities` - Audit log
- `agent_sessions` - Running processes
- `schedules` - Heartbeat cron

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Infinite loops | Budget limits per task, human approval for merges |
| Bad code merged | Reviewer runs tests, main branch protected |
| Context drift | Fresh sessions, clear task descriptions |
| High costs | Cheap models for routine, expensive only for coding |

---

## Definition of Done

The PoC is **done** when we can:

1. Run `agentos start` and see all 3 agents heartbeating
2. Run `agentos task create "Add a WebSearch tool"` 
3. Watch Orchestrator break it down
4. Watch Worker implement it
5. Watch Reviewer approve and merge
6. Run `agentos agent status` and see the new tool available

**That's it.** If the system can improve itself, everything else is just iteration.
