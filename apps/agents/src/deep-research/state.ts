import { SwarmState } from "@langchain/langgraph-swarm";
import { createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";
import { ModelState } from "src/model/states.js";
import { createState } from "src/super-agent/state-builder.js";
import { createDefaultAnnotation } from "src/utils/index.js";
import { z } from "zod";

export const DeepResearchState = createState(createReactAgentAnnotation(), ModelState, SwarmState).build({
    locale: createDefaultAnnotation(() => "en-US"),
    observations: createDefaultAnnotation<string[]>(() => []),
    plan_iterations: createDefaultAnnotation(() => 0),
    current_plan: createDefaultAnnotation<Plan | null>(() => null),
    final_report: createDefaultAnnotation<string>(() => ""),
    auto_accepted_plan: createDefaultAnnotation<boolean>(() => false),
    enable_background_investigation: createDefaultAnnotation<boolean>(() => true),
    background_investigation_results: createDefaultAnnotation<string>(() => ""),
    title: createDefaultAnnotation<string>(() => ""),
});
export type State = typeof DeepResearchState.State;

export const StepType = z.enum(["research", "processing"]);

// For TypeScript enum compatibility
export type StepType = z.infer<typeof StepType>;
export const StepTypeEnum = {
    RESEARCH: "research" as const,
    PROCESSING: "processing" as const,
} as const;

export const Step = z.object({
    need_web_search: z.boolean(),
    title: z.string(),
    description: z.string(),
    step_type: StepType,
    execution_res: z.string().optional(),
});

export type Step = z.infer<typeof Step>;

export const Plan = z.object({
    locale: z.string(),
    has_enough_context: z.boolean(),
    thought: z.string(),
    title: z.string().describe("The title of the research"),
    steps: z.array(Step),
});

export type Plan = z.infer<typeof Plan>;

export const ConfigurationState = createState().build({});
