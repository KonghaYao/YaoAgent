import { z } from "zod";
import TurndownService from "turndown";
import { getMetaData, metaDataToYaml } from "./getMetaData.js";
import { ReadableCleaner } from "./cleaner/ReadableCleaner.js";
import { InfoQCleaner } from "./cleaner/InfoQCleaner.js";
import { HTMLCleaner, NoCleaner } from "./cleaner/HTMLCleaner.js";
import { npmPlugin, aTagCleanPlugin, wechatArticleCleanPlugin } from "./cleaner/readablePlugins/index.js";
import { decodeCharset } from "./utils/decodeCharset.js";
import { createCommonHeaders } from "./utils/createCommonHeaders.js";
import { DockerHubCleaner } from "./cleaner/DockerHubCleaner.js";

export const ExtractSchema = z.object({
    url: z.string().url().describe("the url to crawl"),
    raw: z.boolean().optional().default(false).describe("return raw html"),
});

export async function extractReadableContent(html: string, originUrl: string) {
    const cleaners: HTMLCleaner[] = [
        new NoCleaner(html, originUrl, []),
        new DockerHubCleaner(html, originUrl),
        new InfoQCleaner(html, originUrl),
        new ReadableCleaner(html, originUrl).addPlugin(wechatArticleCleanPlugin).addPlugin(npmPlugin).addPlugin(aTagCleanPlugin),
    ];
    const cleaner = cleaners.find((cleaner) => cleaner.isMatch(originUrl))!;
    return await cleaner.getCleanContent();
}

export const getHTMLContent = async (url: string): Promise<string> => {
    const res = await fetch(url, {
        headers: createCommonHeaders(url),
    });
    const charset = res.headers
        .get("content-type")
        ?.match(/charset=([^;]+)/)?.[1]
        .split(",")[0]
        .toLowerCase();
    const htmlText = decodeCharset(await res.arrayBuffer(), charset);
    return htmlText as string;
};

export async function extract({ url, raw }: z.infer<typeof ExtractSchema>): Promise<string> {
    const htmlText = await getHTMLContent(url);
    const { content = htmlText, metaData, isPureMarkdown } = await extractReadableContent(htmlText as string, url);

    if (raw) {
        return content as string;
    }

    const markdown = isPureMarkdown ? content : HTMLToMarkdown(content as string);
    return metaDataToYaml(metaData) + "\n---\n\n" + markdown;
}

export const HTMLToMarkdown = (html: string) => {
    const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        fence: "```",
    });
    return turndownService.turndown(html);
};
