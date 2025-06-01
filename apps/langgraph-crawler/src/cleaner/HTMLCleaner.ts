import { MetaData } from "../getMetaData.js";

export abstract class HTMLCleaner {
    protected html: string;
    protected originUrl: string;
    constructor(html: string, originUrl: string) {
        this.html = html;
        this.originUrl = originUrl;
    }
    abstract getCleanContent(): Promise<{ content: string; metaData: MetaData }>;
    abstract isMatch(url: string): boolean;
}

export class NoCleaner extends HTMLCleaner {
    private disabledURLs: string[];
    constructor(html: string, originUrl: string, disabledURLs: string[]) {
        super(html, originUrl);
        this.disabledURLs = disabledURLs;
    }

    isMatch(url: string): boolean {
        return this.disabledURLs.some((disabledURL) => url.includes(disabledURL));
    }
    async getCleanContent() {
        return {
            content: this.html,
            metaData: {},
        };
    }
}
