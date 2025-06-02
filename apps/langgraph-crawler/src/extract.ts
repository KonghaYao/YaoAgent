import { z } from "zod";
import TurndownService from "turndown";
import { getMetaData, metaDataToYaml } from "./getMetaData.js";
import { ReadableCleaner } from "./cleaner/ReadableCleaner.js";
import { InfoQCleaner } from "./cleaner/InfoQCleaner.js";
import { NoCleaner } from "./cleaner/HTMLCleaner.js";
import { npmPlugin, aTagCleanPlugin, wechatArticleCleanPlugin } from "./cleaner/readablePlugins/index.js";
import { decodeCharset } from "./utils/decodeCharset.js";
import { createCommonHeaders } from "./utils/createCommonHeaders.js";

export const ExtractSchema = z.object({
    url: z.string().url().describe("the url to crawl"),
    raw: z.boolean().optional().default(false).describe("return raw html"),
});

export async function extractReadableContent(html: string, originUrl: string) {
    const cleaners = [
        new NoCleaner(html, originUrl, []),
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
    const { content, metaData } = (await extractReadableContent(htmlText as string, url)) ?? htmlText;

    if (raw) {
        return content as string;
    }

    const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        fence: "```",
    });

    const markdown = turndownService.turndown(content as string);
    return metaDataToYaml(metaData) + "\n---\n\n" + markdown;
}
