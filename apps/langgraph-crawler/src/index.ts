import { z } from "zod";
import TurndownService from "turndown";
import iconv from "iconv-lite";
import { getMetaData, metaDataToYaml } from "./getMetaData.js";
import { WeChatArticleCleaner } from "./cleaner/WeChatArticleCleaner.js";
import { ReadableCleaner } from "./cleaner/ReadableCleaner.js";
import { InfoQCleaner } from "./cleaner/InfoQCleaner.js";
import { NoCleaner } from "./cleaner/HTMLCleaner.js";

const { decode } = iconv;

const schema = z.object({
    url: z.string().url().describe("the url to crawl"),
    raw: z.boolean().optional().default(false).describe("return raw html"),
});

async function extractReadableContent(html: string, originUrl: string) {
    const cleaners = [new NoCleaner(html, originUrl, []), new InfoQCleaner(html, originUrl), new WeChatArticleCleaner(html, originUrl), new ReadableCleaner(html, originUrl)];
    const cleaner = cleaners.find((cleaner) => cleaner.isMatch(originUrl))!;
    return await cleaner.getCleanContent();
}

export async function handleRequest(req: Request): Promise<Response> {
    if (req.method === "POST") {
        let json;
        try {
            json = await req.json();
        } catch (_) {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
                status: 400,
            });
        }

        if (!schema.safeParse(json).success) {
            return new Response(JSON.stringify({ error: "Invalid URL" }), {
                status: 400,
            });
        }

        try {
            const res = await fetch(json.url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    Accept: "*/*",
                    "Accept-Language": "zh-CN,zh;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br",
                    Connection: "keep-alive",
                    Referer: json.url,
                    Host: new URL(json.url).host,
                    "Upgrade-Insecure-Requests": "1",
                },
            });
            const charset = res.headers
                .get("content-type")
                ?.match(/charset=([^;]+)/)?.[1]
                .split(",")[0]
                .toLowerCase();
            const htmlText = decodeCharset(await res.arrayBuffer(), charset);
            // console.log(htmlText);
            const { content, metaData } = (await extractReadableContent(htmlText as string, json.url as string)) ?? htmlText;
            if (json.raw) {
                return new Response(content, { status: 200 });
            }
            const turndownService = new TurndownService({
                headingStyle: "atx",
                codeBlockStyle: "fenced",
                fence: "```",
            });

            const markdown = turndownService.turndown(content as string);

            return new Response(metaDataToYaml(metaData) + "\n---\n\n" + markdown, { status: 200 });
        } catch (error) {
            console.error(error);
            return new Response(JSON.stringify({ error: (error as Error).message }), {
                status: 500,
            });
        }
    } else {
        return new Response("Method not allowed", { status: 405 });
    }
}

function decodeCharset(text: ArrayBuffer, charset: string = "utf-8") {
    try {
        return decode(new Uint8Array(text) as unknown as Buffer, charset);
    } catch (error) {
        console.error(`Failed to decode text with charset ${charset}:`, error);
        return text;
    }
}
