import { tool } from "@langchain/core/tools";
import { z } from "zod";
// 存储思考历史
const thoughtHistory: any[] = [];
const branches: Record<string, any[]> = {};

export const SequentialThinkingTool = tool(
    async (args) => {
        try {
            if (args.thoughtNumber > args.totalThoughts) {
                args.totalThoughts = args.thoughtNumber;
            }

            thoughtHistory.push(args);

            if (args.branchFromThought && args.branchId) {
                if (!branches[args.branchId]) {
                    branches[args.branchId] = [];
                }
                branches[args.branchId].push(args);
            }

            return JSON.stringify(
                {
                    thoughtNumber: args.thoughtNumber,
                    totalThoughts: args.totalThoughts,
                    nextThoughtNeeded: args.nextThoughtNeeded,
                    branches: Object.keys(branches),
                    thoughtHistoryLength: thoughtHistory.length,
                },
                null,
                2
            );
        } catch (error) {
            return JSON.stringify(
                {
                    error: error instanceof Error ? error.message : String(error),
                    status: "failed",
                },
                null,
                2
            );
        }
    },
    {
        name: "sequential-thinking",
        description: `A detailed tool for dynamic and reflective problem-solving through thoughts.
This tool helps analyze problems through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.

When to use this tool:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

Key features:
- You can adjust total_thoughts up or down as you progress
- You can question or revise previous thoughts
- You can add more thoughts even after reaching what seemed like the end
- You can express uncertainty and explore alternative approaches
- Not every thought needs to build linearly - you can branch or backtrack
- Generates a solution hypothesis
- Verifies the hypothesis based on the Chain of Thought steps
- Repeats the process until satisfied
- Provides a correct answer`,
        schema: z.object({
            thought: z.string().describe("Your current thinking step"),
            nextThoughtNeeded: z.boolean().describe("Whether another thought step is needed"),
            thoughtNumber: z.number().min(1).describe("Current thought number"),
            totalThoughts: z.number().min(1).describe("Estimated total thoughts needed"),
            isRevision: z.boolean().optional().describe("Whether this revises previous thinking"),
            revisesThought: z.number().min(1).optional().describe("Which thought is being reconsidered"),
            branchFromThought: z.number().min(1).optional().describe("Branching point thought number"),
            branchId: z.string().optional().describe("Branch identifier"),
            needsMoreThoughts: z.boolean().optional().describe("If more thoughts are needed"),
        }),
    }
);
