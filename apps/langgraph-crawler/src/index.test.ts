import { describe, expect, test, vi, beforeEach } from "vitest";
import { handleRequest } from "./index.js";

describe("handleRequest", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });
    // 测试爬取 https://www.npmjs.com/package/@langchain/langgraph
    test("should crawl @langchain/langgraph", async () => {
        const data = await handleRequest(
            new Request("https://www.npmjs.com", {
                method: "POST",
                body: JSON.stringify({ url: "https://www.npmjs.com/package/@langchain/langgraph" }),
            })
        );
        expect(data.status).toBe(200);
        expect(await data.text()).toContain("github.com/langchain-ai/langgraphjs");
    });
    // 测试爬取微信公众号
    test("should crawl wechat", async () => {
        const data = await handleRequest(
            new Request("https://mp.weixin.qq.com/s/n_YMqlK6EUbuMSym_Gq4bA", {
                method: "POST",
                body: JSON.stringify({ url: "https://mp.weixin.qq.com/s/n_YMqlK6EUbuMSym_Gq4bA" }),
            })
        );
        const text = await data.text();
        expect(data.status).toBe(200);
        // 应该包含多行代码
        // 微信这里会有 pre 下面多个 code 的情况，需要整合为一个
        expect(text).toContain("knowledge-representation.org/j.z.pan/");
        expect(text).toContain("```javascript");
        // 图片的 data-src 需要替换为 src
        expect(text).toContain("![](https://mmbiz.qpic.cn/sz_mmbiz_png/AE74ia62XricEcVK7G4HbPIV5");
        // 应该包含 metadata 数据
        expect(text).toContain("  title: 首次全面复盘AI Agents记忆系统：3大类，6种操作！");
    });
});
