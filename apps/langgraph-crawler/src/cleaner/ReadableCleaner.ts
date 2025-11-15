import { Readability } from "@mozilla/readability";
import { HTMLCleaner } from "./HTMLCleaner.js";
import { getMetaData, MetaData } from "../getMetaData.js";
import Defuddle from "defuddle";

/** 专门处理可读性好的 html 处理工具 */
export class ReadableCleaner extends HTMLCleaner {
    constructor(html: string, originUrl: string) {
        super(html, originUrl);
    }
    isMatch(url: string): boolean {
        return true;
    }
    async getCleanContent() {
        const doc = await this.getDocument();
        this.beforeClean(doc as unknown as Document);
        const metaData = getMetaData(doc as unknown as Document);
        const parser = new Readability(doc as unknown as Document, {
            keepClasses: true,
        });
        const article = parser.parse();
        if (!article || !article.content) {
            return this.getCleanContentUsingDefuddle(metaData);
        }
        return {
            content: article.content,
            metaData,
        };
    }
    // 使用更加宽松的解析器，解析出内容
    async getCleanContentUsingDefuddle(metaData: MetaData) {
        const doc = await this.getDocument();
        this.beforeClean(doc as unknown as Document);
        /** @ts-ignore */
        const parser = new Defuddle(doc, {
            keepClasses: true,
        });
        const article = parser.parse();
        if (!article || !article.content) {
            throw new Error("No article found");
        }
        return {
            content: article.content,
            metaData,
        };
    }
    plugins: Array<ReadableCleanerPlugin> = [];
    addPlugins(plugin: ReadableCleanerPlugin[]) {
        plugin.forEach((p) => {
            this.plugins.push(p);
        });
        return this;
    }
    beforeClean(doc: Document) {
        this.plugins.forEach((plugin) => {
            if (plugin.beforeClean) {
                plugin.beforeClean(doc, this);
            }
        });
    }
}

export interface ReadableCleanerPlugin {
    name: string;
    beforeClean?: (doc: Document, cleaner: ReadableCleaner) => void;
    afterClean?: (doc: Document, cleaner: ReadableCleaner) => void;
}
