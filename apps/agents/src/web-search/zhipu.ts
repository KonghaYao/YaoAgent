import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

interface SearchResult {
    content: string;
}

interface ToolCall {
    search_result?: SearchResult[];
}

interface Message {
    role: string;
    content: string;
    tool_calls?: ToolCall[];
}

interface Choice {
    message: Message;
}

interface ApiResponse {
    choices?: Choice[];
    error?: {
        message: string;
    };
}

/**
 * 使用智谱 API 进行网络搜索
 * @param query 搜索查询字符串
 * @returns 搜索结果数组
 */
export async function webSearch(query: string): Promise<string[]> {
    try {
        const apiKey = process.env.BIGMODEL_API_KEY || "";
        const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "glm-4",
                messages: [
                    {
                        role: "user",
                        content: query,
                    },
                ],
                tools: [
                    {
                        type: "web_search",
                        web_search: {
                            enable: true,
                            search_query: query,
                        },
                    },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ApiResponse = await response.json();

        // 处理错误情况
        if (data.error) {
            throw new Error(`Error: ${data.error.message}`);
        }

        // 处理正常结果
        const resData: string[] = [];
        for (const choice of data.choices || []) {
            const messages = choice.message;
            for (const toolCall of messages.tool_calls || []) {
                if (toolCall.search_result) {
                    const searchResults = toolCall.search_result;
                    for (const result of searchResults) {
                        if (result.content) {
                            resData.push(result.content);
                        }
                    }
                }
            }
        }
        return resData;
    } catch (error) {
        if (error instanceof Error) {
            return [`Error: ${error.message}`];
        }
        return ["Error: Unknown error occurred"];
    }
}
