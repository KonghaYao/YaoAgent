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
