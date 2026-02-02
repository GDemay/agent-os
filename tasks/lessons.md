# Lessons Learned

> Patterns and mistakes to avoid. Updated after every correction.

---

## 2026-02-02 - Initial Setup

### Lesson: Start Simple
- Don't build 10 agents when 3 will prove the pattern
- File-based coordination fails at scale (use database)
- Always design for self-improvement from day 1

### Lesson: Separate Concerns
- Orchestrator plans, Worker codes, Reviewer validates
- Each agent has ONE job
- Don't let agents cross responsibilities

---

*Add new lessons here as they emerge.*
