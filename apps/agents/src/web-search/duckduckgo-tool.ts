import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * 搜索结果接口
 */
interface SearchResult {
    /** 搜索结果标题 */
    title: string;
    /** 搜索结果链接 */
    href: string;
    /** 搜索结果内容 */
    body: string;
}

/**
 * 图片搜索结果接口
 */
interface ImageResult {
    /** 图片标题 */
    title: string;
    /** 图片URL */
    image: string;
    /** 缩略图URL */
    thumbnail: string;
    /** 图片来源页面URL */
    url: string;
    /** 图片高度 */
    height: number;
    /** 图片宽度 */
    width: number;
    /** 图片来源 */
    source: string;
}

/**
 * 搜索请求参数接口
 */
interface SearchPayload {
    /** 搜索关键词 */
    q: string;
    /** 地区设置 */
    kl?: string;
    /** 语言设置 */
    l?: string;
    /** 分页起始位置 */
    s?: number;
    /** 时间限制 */
    df?: string | null;
    /** 验证码 */
    vqd?: string;
    /** 输出格式 */
    o?: string;
    /** 搜索参数 */
    sp?: string;
    /** 排除参数 */
    ex?: string;
    /** 安全搜索参数 */
    p?: string;
    /** 过滤参数 */
    f?: string;
}

/** 用于移除HTML标签的正则表达式 */
const REGEX_STRIP_TAGS = /<[^>]*>/g;

/**
 * 转义HTML实体
 * @param text 需要转义的文本
 */
const unescape = (text: string): string => 
    text.replace(/&quot;/g, '"');

/**
 * 替换文本
 * @param pattern 匹配模式
 * @param replacement 替换文本
 * @param text 原始文本
 */
const sub = (pattern: RegExp, replacement: string, text: string): string => 
    text.replace(pattern, replacement);

/**
 * URL解码
 * @param url 需要解码的URL
 */
const unquote = (url: string): string => url;

/**
 * 检查URL是否包含500错误
 * @param url 需要检查的URL
 */
const is500InUrl = (url: string): boolean => 
    url.includes("500");

/**
 * 规范化HTML文本
 * @param rawHtml 原始HTML文本
 */
const normalize = (rawHtml: string): string => 
    rawHtml ? unescape(sub(REGEX_STRIP_TAGS, "", rawHtml)) : "";

/**
 * 规范化URL
 * @param url 需要规范化的URL
 */
const normalizeUrl = (url: string): string => 
    url ? unquote(url).replace(" ", "+") : "";

/**
 * 发送HTTP请求
 * @param method 请求方法
 * @param url 请求URL
 * @param params 请求参数
 * @returns 响应对象或null
 */
const getUrl = async (method: string, url: string, params: Record<string, any>): Promise<Response | null> => {
    for (let i = 0; i < 3; i++) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const fullUrl = method === "GET" ? `${url}?${queryString}` : url;

            const response = await fetch(fullUrl, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: method !== "GET" ? JSON.stringify(params) : undefined,
            });

            if (is500InUrl(fullUrl) || response.status === 202) {
                throw new Error("Server error");
            }

            if (response.status === 200) {
                return response;
            }
        } catch (ex) {
            const error = ex as Error;
            console.warn(`_getUrl() ${url} ${error.name} ${error.message}`);
            if (i >= 2 || error.message.includes("418")) {
                throw ex;
            }
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    return null;
};

/**
 * 获取VQD（验证码）
 * @param keywords 搜索关键词
 * @returns VQD字符串或null
 */
const getVqd = async (keywords: string): Promise<string | null> => {
    try {
        const response = await getUrl("GET", "https://duckduckgo.com", {
            q: keywords,
        });

        if (response) {
            const text = await response.text();
            for (const [startMarker, endMarker] of [
                ['vqd="', '"'],
                ["vqd=", "&"],
                ["vqd='", "'"],
            ]) {
                try {
                    const start = text.indexOf(startMarker) + startMarker.length;
                    const end = text.indexOf(endMarker, start);
                    return text.substring(start, end);
                } catch (error) {
                    console.warn(`_getVqd() keywords=${keywords} vqd not found`);
                }
            }
        }
    } catch (error) {
        console.error("Error getting VQD:", error);
    }
    return null;
};

/**
 * 图片搜索
 * @param keywords 搜索关键词
 * @param region 地区设置
 * @param safeSearch 安全搜索级别
 * @param timeLimit 时间限制
 * @param size 图片大小
 * @param color 图片颜色
 * @param typeImage 图片类型
 * @param layout 布局
 * @param licenseImage 图片许可证
 * @returns 图片搜索结果生成器
 */
async function* images(
    keywords: string,
    region: string = "wt-wt",
    safeSearch: string = "moderate",
    timeLimit: string | null = null,
    size: string | null = null,
    color: string | null = null,
    typeImage: string | null = null,
    layout: string | null = null,
    licenseImage: string | null = null
): AsyncGenerator<ImageResult> {
    if (!keywords) {
        throw new Error("Keywords are mandatory");
    }

    const vqd = await getVqd(keywords);
    if (!vqd) {
        throw new Error("Error in getting vqd");
    }

    const safeSearchBase: Record<string, number> = { on: 1, moderate: 1, off: -1 };
    const timeLimitStr = timeLimit ? `time:${timeLimit}` : "";
    const sizeStr = size ? `size:${size}` : "";
    const colorStr = color ? `color:${color}` : "";
    const typeImageStr = typeImage ? `type:${typeImage}` : "";
    const layoutStr = layout ? `layout:${layout}` : "";
    const licenseImageStr = licenseImage ? `license:${licenseImage}` : "";

    const payload: SearchPayload = {
        l: region,
        o: "json",
        s: 0,
        q: keywords,
        vqd: vqd,
        f: `${timeLimitStr},${sizeStr},${colorStr},${typeImageStr},${layoutStr},${licenseImageStr}`,
        p: safeSearchBase[safeSearch.toLowerCase()].toString(),
    };

    const cache = new Set<string>();
    for (let _ = 0; _ < 10; _++) {
        const response = await getUrl("GET", "https://duckduckgo.com/i.js", payload);

        if (!response) {
            break;
        }

        try {
            const responseJson = await response.json();
            const pageData = responseJson.results;
            if (!pageData) {
                break;
            }

            let resultExists = false;
            for (const row of pageData) {
                const imageUrl = row.image;
                if (imageUrl && !cache.has(imageUrl)) {
                    cache.add(imageUrl);
                    resultExists = true;
                    yield {
                        title: row.title,
                        image: normalizeUrl(imageUrl),
                        thumbnail: normalizeUrl(row.thumbnail),
                        url: normalizeUrl(row.url),
                        height: row.height,
                        width: row.width,
                        source: row.source,
                    };
                }
            }

            const next = responseJson.next;
            if (next) {
                payload.s = parseInt(next.split("s=")[1].split("&")[0]);
            }

            if (!next || !resultExists) {
                break;
            }
        } catch (error) {
            break;
        }
    }
}

/**
 * 文本搜索
 * @param keywords 搜索关键词
 * @param region 地区设置
 * @param safeSearch 安全搜索级别
 * @param timeLimit 时间限制
 * @returns 文本搜索结果生成器
 */
async function* text(
    keywords: string,
    region: string = "wt-wt",
    safeSearch: string = "moderate",
    timeLimit: string | null = null
): AsyncGenerator<SearchResult> {
    if (!keywords) {
        throw new Error("Keywords are mandatory");
    }

    const vqd = await getVqd(keywords);
    if (!vqd) {
        throw new Error("Error in getting vqd");
    }

    const payload: SearchPayload = {
        q: keywords,
        kl: region,
        l: region,
        s: 0,
        df: timeLimit,
        vqd: vqd,
        o: "json",
        sp: "0",
    };

    safeSearch = safeSearch.toLowerCase();
    if (safeSearch === "moderate") {
        payload.ex = "-1";
    } else if (safeSearch === "off") {
        payload.ex = "-2";
    } else if (safeSearch === "on") {
        payload.p = "1";
    }

    const cache = new Set<string>();
    const searchPositions = ["0", "20", "70", "120"];

    for (const position of searchPositions) {
        payload.s = parseInt(position);
        const response = await getUrl("GET", "https://links.duckduckgo.com/d.js", payload);

        if (!response) {
            break;
        }

        try {
            const responseJson = await response.json();
            const pageData = responseJson.results;
            if (!pageData) {
                break;
            }

            let resultExists = false;
            for (const row of pageData) {
                const href = row.u;
                if (href && !cache.has(href) && href !== `http://www.google.com/search?q=${keywords}`) {
                    cache.add(href);
                    const body = normalize(row.a);
                    if (body) {
                        resultExists = true;
                        yield {
                            title: normalize(row.t),
                            href: normalizeUrl(href),
                            body: body,
                        };
                    }
                }
            }

            if (!resultExists) {
                break;
            }
        } catch (error) {
            break;
        }
    }
}

/**
 * DuckDuckGo 搜索工具
 * 提供文本和图片搜索功能
 */
export const DuckDuckGoSearchTool = tool(
    async (params) => {
        try {
            const {
                query,
                searchType = "text",
                region = "wt-wt",
                safeSearch = "moderate",
                timeLimit,
                size,
                color,
                typeImage,
                layout,
                licenseImage,
            } = params;

            const results = [];
            
            if (searchType === "text") {
                for await (const result of text(query, region, safeSearch, timeLimit)) {
                    results.push(result);
                }
            } else if (searchType === "image") {
                for await (const result of images(
                    query,
                    region,
                    safeSearch,
                    timeLimit,
                    size,
                    color,
                    typeImage,
                    layout,
                    licenseImage
                )) {
                    results.push(result);
                }
            } else {
                throw new Error("不支持的搜索类型");
            }

            return JSON.stringify(results);
        } catch (error) {
            if (error instanceof Error) {
                return `搜索失败: ${error.message}`;
            }
            return "搜索失败: 未知错误";
        }
    },
    {
        name: "duckduckgo_search",
        description: "使用 DuckDuckGo 搜索引擎进行文本或图片搜索",
        schema: z.object({
            query: z.string().describe("搜索关键词"),
            searchType: z.enum(["text", "image"]).describe("搜索类型：text 或 image").default("text"),
            region: z.string().describe("地区设置").optional(),
            safeSearch: z.string().describe("安全搜索级别").optional(),
            timeLimit: z.string().describe("时间限制").optional(),
            size: z.string().describe("图片大小").optional(),
            color: z.string().describe("图片颜色").optional(),
            typeImage: z.string().describe("图片类型").optional(),
            layout: z.string().describe("布局").optional(),
            licenseImage: z.string().describe("图片许可证").optional(),
        }),
    }
);
