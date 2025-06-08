import { createModelHelper } from "@langgraph-js/pro";

export const { ModelState, createLLM } = createModelHelper({
    main_model: ["gemini-2.5-flash"],
    memory_model: ["gpt-4.1-nano"],
    planner_model: ["gpt-4o-mini"],
    coordinator_model: ["gpt-4o-mini"],
    reporter_model: ["gpt-4o-mini"],
});
