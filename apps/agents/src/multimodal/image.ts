import { AIMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { randomUUID } from "crypto";
import OpenAI from "openai";
import { GraphState } from "src/super-agent/state.js";
import { z } from "zod";

export const simpleImageRecognition = async (state: GraphState) => {
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
export const simpleImageRecognitionTool = tool(
    async ({ url, model }) => {
        const openai = new OpenAI();
        const response = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "识别图片类型并提取主要内容，简明回复不超过50字。若检测到运单图片，请明确告知用户需使用专业运单识别工具获取详细信息。请描述图片中可见的关键元素和整体内容。",
                        },
                        {
                            type: "image_url",
                            image_url: { url },
                        },
                    ],
                },
            ],
            temperature: 0.1,
        });

        const content = `${response.choices[0].message.content}\n> 图片 URL: ${url}`;
        return content;
    },
    {
        name: "notebook",
        description: "管理笔记的工具，支持写入、读取和删除操作",
        schema: z.object({
            url: z.string().describe("图片URL"),
            model: z.string().describe("模型").default("gemini-2.5-flash"),
        }),
    }
);
