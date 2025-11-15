import { describe, expect, test, vi, beforeEach } from "vitest";
import { extract } from "./extract.js";

describe("extract", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });
    // 测试爬取 https://www.npmjs.com/package/@langchain/langgraph
    test("should crawl @langchain/langgraph", async () => {
        const response = await extract({
            urls: ["https://www.npmjs.com/package/@langchain/langgraph"],
            include_images: false,
            include_favicon: false,
            extract_depth: "basic",
            format: "markdown",
        });
        expect(response.results).toHaveLength(1);
        const text = response.results[0].raw_content;
        expect(text).toContain("/langchain-ai/langgraphjs");
        // 修补代码块缺失
        expect(text).toContain("```typescript");
    });
    // 测试爬取微信公众号
    test("should crawl wechat", async () => {
        const response = await extract({
            urls: ["https://mp.weixin.qq.com/s/n_YMqlK6EUbuMSym_Gq4bA"],
            include_images: false,
            include_favicon: false,
            extract_depth: "basic",
            format: "markdown",
        });
        expect(response.results).toHaveLength(1);
        const text = response.results[0].raw_content;
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
        const response = await extract({
            urls: ["https://searx.bndkt.io/search?q=Hono+%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%A1%86%E6%9E%B6+%E4%BC%98%E7%BC%BA%E7%82%B9&safesearch=0&category_general=1&pageno=1&theme=simple&language=all"],
            include_images: false,
            include_favicon: false,
            extract_depth: "basic",
            format: "markdown",
        });
        expect(response.results).toHaveLength(1);
        const text = response.results[0].raw_content;
        expect(text).toContain("Hono框架");
    });
    test("should crawl dockerhub", async () => {
        const response = await extract({
            urls: ["https://hub.docker.com/r/oven/bun"],
            include_images: false,
            include_favicon: false,
            extract_depth: "basic",
            format: "markdown",
        });
        expect(response.results).toHaveLength(1);
        const text = response.results[0].raw_content;
        expect(text).toContain("oven/bun");
    });
    test("should crawl dockerhub", async () => {
        const response = await extract({
            urls: ["https://hub.docker.com/_/python"],
            include_images: false,
            include_favicon: false,
            extract_depth: "basic",
            format: "markdown",
        });
        expect(response.results).toHaveLength(1);
        const text = response.results[0].raw_content;
        expect(text).toContain("Python");
    });
    test("should crawl with content header", async () => {
        const response = await extract({
            urls: ["https://ai-sdk.dev/docs/guides/openai-responses"],
            include_images: false,
            include_favicon: false,
            extract_depth: "basic",
            format: "markdown",
        });
        expect(response.results).toHaveLength(1);
        const text = response.results[0].raw_content;
        expect(text).toContain("OpenAI Responses API");
    });
    test("should crawl juejin", async () => {
        const response = await extract({
            urls: ["https://juejin.cn/post/7476665749126742025"],
            include_images: false,
            include_favicon: false,
            extract_depth: "basic",
            format: "markdown",
        });
        expect(response.results).toHaveLength(1);
        const text = response.results[0].raw_content;
        expect(text).toContain("Multimodality");
    });

    test("should handle multiple urls", async () => {
        const response = await extract({
            urls: ["https://www.npmjs.com/package/@langchain/langgraph", "https://hub.docker.com/r/oven/bun"],
            include_images: false,
            include_favicon: false,
            extract_depth: "basic",
            format: "markdown",
        });
        expect(response.results).toHaveLength(2);
        expect(response.results[0].url).toBe("https://www.npmjs.com/package/@langchain/langgraph");
        expect(response.results[1].url).toBe("https://hub.docker.com/r/oven/bun");
        expect(response.failed_results).toHaveLength(0);
    });

    test("should include favicon when requested", async () => {
        const response = await extract({
            urls: ["https://www.npmjs.com/package/@langchain/langgraph"],
            include_images: false,
            include_favicon: true,
            extract_depth: "basic",
            format: "markdown",
        });
        expect(response.results).toHaveLength(1);
        expect(response.results[0].favicon).toContain("google.com/s2/favicons");
    });

    test("should handle text format", async () => {
        const response = await extract({
            urls: ["https://www.npmjs.com/package/@langchain/langgraph"],
            include_images: false,
            include_favicon: false,
            extract_depth: "basic",
            format: "text",
        });
        expect(response.results).toHaveLength(1);
        const text = response.results[0].raw_content;
        expect(text).toContain("@langchain/langgraph");
        // Text format should not have YAML frontmatter
        expect(text).not.toContain("---");
    });

    test("should handle failed urls", async () => {
        const response = await extract({
            urls: ["https://www.npmjs.com/package/@langchain/langgraph", "https://invalid-domain-that-does-not-exist.com/page"],
            include_images: false,
            include_favicon: false,
            extract_depth: "basic",
            format: "markdown",
        });
        expect(response.results).toHaveLength(1);
        expect(response.results[0].url).toBe("https://www.npmjs.com/package/@langchain/langgraph");
        expect(response.failed_results).toHaveLength(1);
        expect(response.failed_results[0].url).toBe("https://invalid-domain-that-does-not-exist.com/page");
    });

    test("should return response metadata", async () => {
        const response = await extract({
            urls: ["https://www.npmjs.com/package/@langchain/langgraph"],
            include_images: false,
            include_favicon: false,
            extract_depth: "basic",
            format: "markdown",
        });
        expect(response.response_time).toBeGreaterThan(0);
        expect(response.request_id).toBeDefined();
        expect(typeof response.request_id).toBe("string");
    });
});
