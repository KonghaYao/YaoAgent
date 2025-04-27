import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import { GraphState } from "src/super-agent/state.js";
import { z } from "zod";

/** 创建一个图像信息抽取工具, 可以识别图片中更加丰富的内容 */
export const createImageExtractTool = (
    prompt: string,
    modelName: string,
    {
        name = "image_recognition",
        description = "图像信息抽取工具，可以识别图片中更加丰富的内容",
    }: { name?: string; description?: string } = {}
) => {
    return tool(
        async ({ url }) => {
            const openai = new OpenAI();
            const response = await openai.chat.completions.create({
                model: modelName,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "image_url", image_url: { url } },
                            {
                                text: prompt,
                                type: "text",
                            },
                        ],
                    },
                ],
            });
            return response.choices[0].message.content;
        },
        {
            name,
            description,
            schema: z.object({
                url: z.string().describe("图片URL"),
            }),
        }
    );
};
export const simpleImageRecognitionTool = createImageExtractTool(
    "识别图片类型并提取主要内容，简明回复不超过50字。若检测到运单图片，请明确告知用户需使用专业运单识别工具获取详细信息。请描述图片中可见的关键元素和整体内容。",
    "gemini-2.5-flash"
);

/** 部分没有图片识别能力的模型，可以通过这个工具来识别图片信息 */
export const preImageRecognitionNode = async (state: GraphState) => {
    const messages = state.messages;
    const newMessages: BaseMessage[] = [];
    for (const message of messages) {
        newMessages.push(message);
        if (message.getType() === "human" && message.content && Array.isArray(message.content)) {
            for (const content of message.content) {
                if (content.type === "image_url") {
                    const message = new AIMessage({
                        content: "",
                        tool_calls: [
                            {
                                name: "simple_image_recognition",
                                args: { url: content.image_url.url },
                                id: randomUUID(),
                                type: "tool_call",
                            },
                        ],
                    });
                    const toolResult = await new ToolNode([simpleImageRecognitionTool]).invoke({
                        messages: [message],
                    });
                    console.log(toolResult);
                    newMessages.push(message, ...toolResult.messages);
                }
            }
        }
    }
    return { messages: newMessages };
};
