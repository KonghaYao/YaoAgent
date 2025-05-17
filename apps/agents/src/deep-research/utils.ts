import { PromptTemplate } from "@langchain/core/prompts";

import { DeepResearchState } from "./state.js";
import { getPrompt } from "../model/prompt-getter.js";

export const apply_prompt_template = async (prompt_name: string, state: typeof DeepResearchState.State) => {
    const prompt = await getPrompt(prompt_name);
    const prompt_template = new PromptTemplate<typeof DeepResearchState.State>({
        template: prompt,
        inputVariables: Object.keys(state) as any,
    });
    const formatted_prompt = await prompt_template.format(state);
    return formatted_prompt;
};
