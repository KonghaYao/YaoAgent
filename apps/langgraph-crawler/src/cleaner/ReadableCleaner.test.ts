import { describe, expect, test, vi, beforeEach } from "vitest";
import { Readability } from "@mozilla/readability";
import { getDocument } from "../utils/DOMParser.js";
describe("handleRequest", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });
    /**
     * 测试 Readability 的解析结果
     */
    test("should parse readability", () => {
        const html = `
 <div class="highlight">
    <pre>
        <code class="language-javascript">
            console.log("Hello, world!");
        </code>
    </pre>
</div>
        `;
        const doc = getDocument(html);
        const parser = new Readability(doc as unknown as Document, {
            keepClasses: true,
        });
        const article = parser.parse();
        expect(article?.content).toContain("javascript");
    });
});
