import { describe, expect, test, vi, beforeEach } from "vitest";
import { extract } from "./extract.js";

describe("extract", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });
    // 测试爬取 https://www.npmjs.com/package/@langchain/langgraph
    test("should crawl @langchain/langgraph", async () => {
        const text = await extract({
            url: "https://www.npmjs.com/package/@langchain/langgraph",
            raw: false,
        });
        expect(text).toContain("github.com/langchain-ai/langgraphjs");
        // 修补代码块缺失
        expect(text).toContain("```ts");
    });
    // 测试爬取微信公众号
    test("should crawl wechat", async () => {
        const text = await extract({
            url: "https://mp.weixin.qq.com/s/n_YMqlK6EUbuMSym_Gq4bA",
            raw: false,
        });
        // 应该包含多行代码
        // 微信这里会有 pre 下面多个 code 的情况，需要整合为一个
        expect(text).toContain("knowledge-representation.org/j.z.pan/");
        expect(text).toContain("```javascript");
        // 图片的 data-src 需要替换为 src
        expect(text).toContain("![](https://mmbiz.qpic.cn/sz_mmbiz_png/AE74ia62XricEcVK7G4HbPIV5");
        // 应该包含 metadata 数据
        expect(text).toContain("  title: 首次全面复盘AI Agents记忆系统：3大类，6种操作！");
    });
    test("should crawl defuddle", async () => {
        const text = await extract({
            url: "https://searx.bndkt.io/search?q=Hono+%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%A1%86%E6%9E%B6+%E4%BC%98%E7%BC%BA%E7%82%B9&safesearch=0&category_general=1&pageno=1&theme=simple&language=all",
            raw: false,
        });
        expect(text).toContain("Hono框架");
    });
    test("should crawl dockerhub", async () => {
        const text = await extract({
            url: "https://hub.docker.com/r/oven/bun",
            raw: false,
        });
        expect(text).toContain("oven/bun");
    });
    test("should crawl dockerhub", async () => {
        const text = await extract({
            url: "https://hub.docker.com/_/python",
            raw: false,
        });
        expect(text).toContain("Python");
    });
    test("should crawl with content header", async () => {
        const text = await extract({
            url: "https://ai-sdk.dev/docs/guides/openai-responses",
            raw: false,
        });
        expect(text).toContain("OpenAI Responses API");
    });
});
