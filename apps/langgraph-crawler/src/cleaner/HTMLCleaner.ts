import { MetaData } from "../getMetaData.js";
import { getDocument } from "../utils/DOMParser.js";

export abstract class HTMLCleaner {
    readonly html: string;
    readonly originUrl: string;
    constructor(html: string, originUrl: string) {
        this.html = html;
        this.originUrl = originUrl;
    }
    abstract getCleanContent(): Promise<{ content: string; metaData: MetaData; isPureMarkdown?: boolean }>;
    abstract isMatch(url: string): boolean;
    getDocument() {
        return getDocument(this.html, this.originUrl);
    }
}

export class NoCleaner extends HTMLCleaner {
    private disabledURLs: RegExp[];
    constructor(html: string, originUrl: string, disabledURLs: RegExp[]) {
        super(html, originUrl);
        this.disabledURLs = disabledURLs;
    }

    isMatch(url: string): boolean {
        return this.disabledURLs.some((disabledURL) => disabledURL.test(url));
    }
    async getCleanContent() {
        return {
            content: this.html,
            metaData: {},
        };
    }
}
