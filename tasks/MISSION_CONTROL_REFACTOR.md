# Mission Control UI Refactor

## Analysis Summary

Mission Control has a sophisticated 3-panel layout:
1. **Left: Agent List** - 16 agents with avatars, role badges, status
2. **Center: Mission Queue (Kanban)** - INBOX → ASSIGNED → IN PROGRESS → REVIEW → per-agent
3. **Right: Agent Profile** - Full profile with skills, about, attention, messaging

## Required Changes

### 1. Schema Updates (Priority: HIGH)
- [ ] Add `avatar` field to Agent (URL or emoji)
- [ ] Add `roleType` field to Agent (LEAD, SPECIALIST, INTERN)
- [ ] Add `about` field to Agent (personality/mission description)
- [ ] Add `skills` JSON array to Agent
- [ ] Add `statusReason` to Agent (what they're currently doing)
- [ ] Add `tags` JSON array to Task

### 2. API Updates (Priority: HIGH)
- [ ] Add `POST /api/agents/:id/message` - Send message to agent
- [ ] Add `GET /api/agents/:id/attention` - Get items needing attention
- [ ] Add `GET /api/agents/:id/timeline` - Get agent activity timeline
- [ ] Add `POST /api/broadcast` - Send broadcast to all agents

### 3. Dashboard UI Refactor (Priority: HIGH)
- [ ] Add fixed header with:
  - Logo + project name
  - Live agent count + task count
  - Chat, Broadcast, Docs buttons
  - Live clock + online status
- [ ] Redesign Agent List:
  - Avatar/emoji
  - Role badge (LEAD/SPC/INT)
  - Role title
  - WORKING status with green dot
- [ ] Add Agent Profile Panel (right side):
  - Large avatar
  - Name + role + badge
  - Status button (WORKING/IDLE)
  - Status reason with "since X ago"
  - About section
  - Skills tags
  - Tabs: Attention, Timeline, Messages
  - Send message input
- [ ] Improve Task Cards:
  - Priority arrow icon
  - Description preview
  - Agent avatar + name
  - Time ago
  - Tags
- [ ] Add ASSIGNED column to kanban

### 4. Agent Personality (Priority: MEDIUM)
- [ ] Create unique avatars/emojis for each agent
- [ ] Write personality "about" for each agent
- [ ] Define skills for each agent

## Implementation Order

1. Schema migration (add new fields)
2. Seed agent personalities  
3. API endpoints for messaging
4. Dashboard UI overhaul
