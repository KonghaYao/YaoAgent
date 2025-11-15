import { Hono } from "hono";
import { ChatOpenAI } from "@langchain/openai";
import { LLMModel } from "./type";
import { streamSSE } from "hono/streaming";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { concat } from "@langchain/core/utils/stream";

interface TestModelRequest extends LLMModel {}

const testModelApp = new Hono();

// POST /test-model - 测试大模型请求
testModelApp.post("/test-model", async (c) => {
    const body: TestModelRequest = await c.req.json();

    const { model_name, token, base_url } = body;

    if (!model_name) {
        return c.json(
            {
                success: false,
                error: "Missing required parameters: model_name is required",
            },
            400
        );
    }

    // 创建 OpenAI 客户端
    const llm: BaseChatModel = new ChatOpenAI({
        model: model_name,
        configuration: {
            baseURL: base_url,
            apiKey: token,
        },
    });

    // 发送测试消息
    return streamSSE(c, async (stream) => {
        const init = [];
        for await (const chunk of await llm.stream(body.messages)) {
            init.push(chunk);
            await stream.writeSSE({
                data: JSON.stringify(init.reduce(concat).toDict()),
            });
        }
    });
});

export default testModelApp;
