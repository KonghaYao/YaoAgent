import { z } from "zod";
import TurndownService from "turndown";
import { getMetaData, metaDataToYaml } from "./getMetaData.js";
import { ReadableCleaner } from "./cleaner/ReadableCleaner.js";
import { InfoQCleaner } from "./cleaner/InfoQCleaner.js";
import { HTMLCleaner, NoCleaner } from "./cleaner/HTMLCleaner.js";
import { npmPlugin, aTagCleanPlugin, wechatArticleCleanPlugin, DeleteStyleCleanPlugin } from "./cleaner/readablePlugins/index.js";
import { decodeCharset } from "./utils/decodeCharset.js";
import { createCommonHeaders } from "./utils/createCommonHeaders.js";
import { DockerHubCleaner } from "./cleaner/DockerHubCleaner.js";

export const ExtractSchema = z.object({
    urls: z.array(z.string().url()).describe("The URL(s) to extract content from"),
    include_images: z.boolean().optional().default(false).describe("Include a list of images extracted from the URLs in the response"),
    include_favicon: z.boolean().optional().default(false).describe("Whether to include the favicon URL for each result"),
    extract_depth: z.enum(["basic", "advanced"]).optional().default("basic").describe("The depth of the extraction process"),
    format: z.enum(["markdown", "text"]).optional().default("markdown").describe("The format of the extracted web page content"),
    timeout: z.number().min(1).max(60).optional().describe("Maximum time in seconds to wait for the URL extraction before timing out"),
});

export interface ExtractResult {
    url: string;
    raw_content: string;
    images?: string[];
    favicon?: string;
}

export interface FailedResult {
    url: string;
    error: string;
}

export interface ExtractResponse {
    results: ExtractResult[];
    failed_results: FailedResult[];
    response_time: number;
    request_id: string;
}

export async function extractReadableContent(html: string, originUrl: string) {
    const cleaners: HTMLCleaner[] = [
        new NoCleaner(html, originUrl, [/\/\/tophub\.today\/c\/news/]),
        new DockerHubCleaner(html, originUrl),
        new InfoQCleaner(html, originUrl),
        new ReadableCleaner(html, originUrl).addPlugins([wechatArticleCleanPlugin, npmPlugin, aTagCleanPlugin, DeleteStyleCleanPlugin]),
    ];
    const cleaner = cleaners.find((cleaner) => cleaner.isMatch(originUrl))!;
    return await cleaner.getCleanContent();
}

export const getHTMLContent = async (url: string): Promise<string> => {
    const cancelToken = new AbortController();
    const headers = createCommonHeaders(url);
    const res = await fetch(url, {
        headers,
        method: "GET",
        signal: cancelToken.signal,
        redirect: "follow",
    });
    const charset = res.headers
        .get("content-type")
        ?.match(/charset=([^;]+)/)?.[1]
        .split(",")[0]
        .toLowerCase();
    // 所有二进制直接删除
    if (res.headers.get("content-type")?.includes("application/pdf")) {
        cancelToken.abort();
        return "It's a binary file! can't extract content";
    }
    const htmlText = decodeCharset(await res.arrayBuffer(), charset);
    return htmlText as string;
};

const urlTransformer = (url: string) => {
    if (url.includes("npmjs.com/package")) {
        return url.replace("npmjs.com/package", "npm.io/package").replace("www.", "");
    }
    return url;
};

async function extractSingleUrl(
    url: string,
    options: {
        include_images: boolean;
        include_favicon: boolean;
        extract_depth: "basic" | "advanced";
        format: "markdown" | "text";
        timeout?: number;
    }
): Promise<ExtractResult> {
    const startTime = Date.now();

    try {
        const timeout = options.timeout || (options.extract_depth === "advanced" ? 30 : 10);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

        const htmlText = await getHTMLContent(urlTransformer(url));
        clearTimeout(timeoutId);

        const { content = htmlText, metaData, isPureMarkdown } = await extractReadableContent(htmlText as string, url);

        let raw_content: string;
        if (options.format === "text") {
            raw_content = content as string;
        } else {
            const markdown = isPureMarkdown ? content : HTMLToMarkdown(content as string);
            raw_content = "---\n" + metaDataToYaml(metaData) + "\n---\n\n" + markdown;
        }

        const result: ExtractResult = {
            url,
            raw_content,
        };

        if (options.include_images) {
            // TODO: Implement image extraction
            result.images = [];
        }

        if (options.include_favicon) {
            // TODO: Implement favicon extraction
        }

        return result;
    } catch (error) {
        throw new Error(`Failed to extract ${url}: ${(error as Error).message}`);
    }
}

export async function extract(params: z.infer<typeof ExtractSchema>): Promise<ExtractResponse> {
    const startTime = Date.now();
    const urls = Array.isArray(params.urls) ? params.urls : [params.urls];

    const results: ExtractResult[] = [];
    const failed_results: FailedResult[] = [];

    // Process URLs in parallel
    const promises = urls.map(async (url) => {
        try {
            const result = await extractSingleUrl(url, {
                include_images: params.include_images || false,
                include_favicon: params.include_favicon || false,
                extract_depth: params.extract_depth || "basic",
                format: params.format || "markdown",
                timeout: params.timeout,
            });
            results.push(result);
        } catch (error) {
            failed_results.push({
                url,
                error: (error as Error).message,
            });
        }
    });

    await Promise.all(promises);

    const response_time = (Date.now() - startTime) / 1000;
    const request_id = crypto.randomUUID();

    return {
        results,
        failed_results,
        response_time,
        request_id,
    };
}

export const HTMLToMarkdown = (html: string) => {
    const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        fence: "```",
    });
    return turndownService.turndown(html);
};
