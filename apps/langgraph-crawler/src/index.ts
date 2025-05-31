import { z } from "zod";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { Window } from "happy-dom";
import iconv from "iconv-lite";
// import fs from "node:fs";
import { getMetaData, MetaData, metaDataToYaml } from "./getMetaData.js";

const { decode } = iconv;

const schema = z.object({
    url: z.string().url().describe("the url to crawl"),
    raw: z.boolean().optional().default(false).describe("return raw html"),
});

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

/** 专门处理微信公众号文章的 html 处理工具 */
export class WeChatArticleCleaner extends HTMLCleaner {
    constructor(html: string, originUrl: string) {
        super(html, originUrl);
    }
    isMatch(url: string) {
        return this.originUrl.includes("mp.weixin.qq.com");
    }
    async getCleanContent() {
        const window = new Window({
            url: this.originUrl,
        });
        const doc = new window.DOMParser().parseFromString(this.html, "text/html");
        const content = doc.getElementById("page-content");
        const metaData = getMetaData(doc as unknown as Document);

        if (!content) {
            throw new Error("No content found");
        }
        content.querySelectorAll("img").forEach((img) => {
            if (img.hasAttribute("data-src")) {
                img.setAttribute("src", img.getAttribute("data-src") ?? "");
            }
        });
        // 所有 pre code 的内容都转为字符串
        const preCode = content.querySelectorAll("pre code");
        preCode.forEach((code) => {
            code.innerHTML = code.textContent ?? "";
        });

        // 如果一个 pre 下面有多个 code, 则整合为一个，使用 换行符换行
        const pre = content.querySelectorAll("pre");
        pre.forEach((pre) => {
            const code = pre.querySelectorAll("code");
            if (code.length > 1) {
                pre.innerHTML = `<code class="language-${pre.getAttribute("data-lang")}">${[...code].map((code: Element) => code.textContent ?? "").join("\n")}</code>`;
            }
        });

        return {
            content: content.innerHTML,
            metaData: metaData,
        };
    }
}

async function extractReadableContent(html: string, originUrl: string) {
    const cleaners = [new WeChatArticleCleaner(html, originUrl), new ReadableCleaner(html, originUrl)];
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
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "Accept-Language": "zh-CN,zh;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br",
                    Connection: "keep-alive",
                    Referer: json.url,
                    Host: new URL(json.url).host,
                },
            });
            const charset = res.headers
                .get("content-type")
                ?.match(/charset=([^;]+)/)?.[1]
                .split(",")[0]
                .toLowerCase();
            const htmlText = decodeCharset(await res.arrayBuffer(), charset);
            // fs.writeFileSync("html.html", htmlText as string);
            const { content, metaData } = (await extractReadableContent(htmlText as string, json.url as string)) ?? htmlText;
            if (json.raw) {
                return new Response(content, { status: 200 });
            }
            // fs.writeFileSync("readable.html", readableContent as string);
            const turndownService = new TurndownService({
                headingStyle: "atx",
                codeBlockStyle: "fenced",
                fence: "```",
            });

            const markdown = turndownService.turndown(content as string);

            return new Response(metaDataToYaml(metaData) + "\n---\n\n" + markdown, { status: 200 });
        } catch (error) {
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
