import { Readability } from "@mozilla/readability";
import { Window } from "happy-dom";
import { HTMLCleaner } from "./HTMLCleaner.js";
import { getMetaData, MetaData } from "../getMetaData.js";

/** 专门处理可读性好的 html 处理工具 */
export class ReadableCleaner extends HTMLCleaner {
    constructor(html: string, originUrl: string) {
        super(html, originUrl);
        this.html = html;
        this.originUrl = originUrl;
    }
    isMatch(url: string): boolean {
        return true;
    }
    async getCleanContent() {
        const window = new Window({
            url: this.originUrl,
        });
        const doc = new window.DOMParser().parseFromString(this.html, "text/html");
        const metaData = getMetaData(doc as unknown as Document);
        const parser = new Readability(doc as unknown as Document);
        const article = parser.parse();
        if (!article || !article.content) {
            throw new Error("No article found");
        }
        return {
            content: article.content,
            metaData: metaData,
        };
    }
}
