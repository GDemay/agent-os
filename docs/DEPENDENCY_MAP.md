# AgentOS Issue Dependency Map

## 🗺️ Visual Dependency Graph

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    INDEPENDENT                          │
                    │  (Can be worked on in PARALLEL by different agents)     │
                    └─────────────────────────────────────────────────────────┘
                                              │
          ┌───────────────────────────────────┼───────────────────────────────────┐
          │                                   │                                   │
          ▼                                   ▼                                   ▼
    ┌──────────┐                       ┌──────────┐                        ┌──────────┐
    │   #6     │                       │  #10     │                        │  #18     │
    │ BaseAgent│                       │ FileSystem│                       │   CLI    │
    │  (Core)  │                       │   Tool   │                        │          │
    └────┬─────┘                       └──────────┘                        └──────────┘
         │                                   │
         │                             ┌─────┴─────┐
         │                             │           │
    ┌────┴────┬────────┐               ▼           ▼
    │         │        │         ┌──────────┐ ┌──────────┐
    ▼         ▼        ▼         │   #12    │ │   #14    │
┌──────┐ ┌──────┐ ┌──────┐       │  Shell   │ │ Database │
│  #7  │ │  #8  │ │  #9  │       │   Tool   │ │   Tool   │
│Orch. │ │Worker│ │Review│       └────┬─────┘ └──────────┘
└──────┘ └──────┘ └──────┘            │
    │         │        │              ▼
    │         │        │        ┌──────────┐
    │         │        │        │   #13    │
    │         │        │        │ Git Tool │
    │         │        │        └──────────┘
    │         │        │
    └────┬────┴────────┘
         │                                        ┌──────────┐
         ▼                                        │   #19    │
    ┌──────────┐                                  │   API    │
    │   #15    │                                  └────┬─────┘
    │Scheduler │                                       │
    └────┬─────┘                                       ▼
         │                                        ┌──────────┐
         ▼                                        │   #20    │
    ┌──────────┐                                  │Dashboard │
    │   #16    │                                  └──────────┘
    │ Runner   │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │   #22    │
    │  TEST    │
    │(Validate)│
    └──────────┘
```

## 📊 Issue Categories

### 🟢 FULLY INDEPENDENT (Start Immediately - Any Agent)
These can be assigned to different agents (Claude, Kimi, Copilot) and worked on simultaneously:

| Issue | Title | Blocker Risk |
|-------|-------|--------------|
| **#6** | BaseAgent class | ⚠️ CRITICAL PATH - Blocks #7,8,9 |
| **#10** | FileSystem Tool | None |
| **#12** | Shell Tool | None |
| **#14** | Database Tool | None |
| **#18** | CLI | None |
| **#19** | API Server | None |

### 🟡 HAS DEPENDENCIES (Wait for prerequisites)

| Issue | Title | Requires |
|-------|-------|----------|
| **#7** | Orchestrator Agent | #6 |
| **#8** | Worker Agent | #6, (#10,#12,#13 for full function) |
| **#9** | Reviewer Agent | #6, (#13 for merge) |
| **#13** | Git Tool | #12 (or build standalone) |
| **#15** | Scheduler | #6, #7, #8, #9 |
| **#16** | Runner | #15 |
| **#20** | Dashboard UI | #19 |
| **#22** | Self-Improvement Test | ALL |

## 🚀 Recommended Parallel Workstreams

### Stream A: Agent Core (CRITICAL PATH)
**Assign to: Primary Agent (Claude/You)**
```
#6 → #7 → #8 → #9 → #15 → #16
```

### Stream B: Tools (INDEPENDENT)
**Assign to: Agent 2 (Kimi)**
```
#10 → #12 → #13 → #14
```

### Stream C: Interface (INDEPENDENT)
**Assign to: Agent 3 (Copilot)**
```
#18 → #19 → #20
```

## ⚠️ Potential Blockers

### 1. DATABASE CONNECTION
**Risk**: Prisma needs a running PostgreSQL
**Mitigation**:
- Use Railway/Neon for instant Postgres
- Or run locally: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`
- Run migrations: `npx prisma migrate dev`

### 2. NVIDIA NIM API KEY
**Risk**: LLM calls will fail without valid key
**Mitigation**:
- Get key from https://build.nvidia.com/
- Add to `.env`: `NVIDIA_NIM_API_KEY=nvapi-...`

### 3. CIRCULAR IMPORTS
**Risk**: Agent ↔ Tool dependencies
**Mitigation**:
- Tools don't import Agents
- Agents import Tools
- Use dependency injection

### 4. GIT PERMISSIONS
**Risk**: Git tool needs push access
**Mitigation**:
- Ensure SSH keys or token are configured
- Test with: `git push origin master`

## 📝 For Each Agent Working on a Task

Before starting ANY task, the agent should:

1. **Read the issue fully** - All context is in the issue body
2. **Check dependencies** - Are prerequisite issues complete?
3. **Create a branch** - `git checkout -b feature/<issue-number>-<short-name>`
4. **Implement** - Follow the code structure in the issue
5. **Build** - `npm run build` must pass
6. **Commit** - Clear message: `feat(#X): description`
7. **Push** - `git push origin feature/...`
8. **Update issue** - Close when done

## 🔄 Sync Points

After each stream completes a phase, sync by:
1. Pull latest master
2. Resolve any conflicts
3. Run full build
4. Continue to next phase
