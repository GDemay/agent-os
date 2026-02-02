## Description
The ultimate test: can the system modify itself?

## Test Scenario
1. Create a high-level task: "Add a WebSearch tool to the system"
2. Orchestrator breaks it down into sub-tasks
3. Worker implements the tool in a feature branch
4. Reviewer validates and merges to main
5. System now has WebSearch capability

## Steps
1. Start all agents: agentos start
2. Create task: agentos task create "Add a WebSearch tool"
3. Monitor dashboard
4. Verify task lifecycle completes
5. Verify new tool exists in codebase

## Success Criteria
- [ ] Orchestrator creates 3-5 sub-tasks
- [ ] Worker creates src/tools/websearch.ts
- [ ] Worker writes tests
- [ ] Reviewer approves and merges
- [ ] agentos agent status shows new tool

## This is the Definition of Done for the PoC
If this test passes, the kernel works and can iterate on itself.

## Dependencies
ALL previous issues

## Estimated Time
2-3 hours (mostly observation)
