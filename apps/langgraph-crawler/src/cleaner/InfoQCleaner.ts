import { Window } from "happy-dom";
import { HTMLCleaner } from "./HTMLCleaner.js";
import { getMetaData } from "../getMetaData.js";
import { tiptapJSONToHTML } from "../utils/tiptapJSONToHTML.js";
export type Root = {
    type: string;
    content: Array<{
        type: string;
        attrs?: {
            indent?: number;
            number?: number;
            align: any;
            origin: any;
            level?: number;
            src?: string;
            alt: any;
            title: any;
            style?: Array<{
                key: string;
                value: string;
            }>;
            href: any;
            fromPaste?: boolean;
            pastePass?: boolean;
        };
        content?: Array<{
            type: string;
            attrs?: {
                href?: string;
                title?: string;
                type: any;
                indent?: number;
                number?: number;
                align: any;
                origin: any;
                listStyle: any;
            };
            content?: Array<{
                type: string;
                text?: string;
                attrs?: {
                    indent: number;
                    number: number;
                    align: any;
                    origin: any;
                };
                content?: Array<{
                    type: string;
                    marks: Array<{
                        type: string;
                        attrs: {
                            color: string;
                            name: string;
                        };
                    }>;
                    text: string;
                }>;
            }>;
            marks?: Array<{
                type: string;
                attrs: {
                    color: string;
                    name: string;
                };
            }>;
            text?: string;
        }>;
    }>;
};

/** 专门处理 InfoQ 的 html 处理工具 */
export class InfoQCleaner extends HTMLCleaner {
    constructor(html: string, originUrl: string) {
        super(html, originUrl);
        this.html = html;
        this.originUrl = originUrl;
    }
    isMatch(url: string): boolean {
        return url.includes("infoq.cn");
    }
    async getCleanContent() {
        // https://www.infoq.cn/news/6DxKgF0KO8kgkYh3EIDT?utm_source=related_read&utm_medium=article
        // 获取 hash id
        const hash = this.originUrl.match(/www.infoq.cn\/.+?\/([^\?]+)/)?.[1];
        if (!hash) {
            throw new Error("No hash found");
        }
        const headers = {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Referer: this.originUrl,
            host: "www.infoq.cn",
        };
        const response = await fetch("https://www.infoq.cn/public/v1/article/getDetail", {
            method: "POST",
            headers,
            body: JSON.stringify({
                uuid: hash,
            }),
        });
        const data = await response.json();
        // console.log(data);
        const contentUrl = data.data.content_url;
        const contentResponse = await fetch(contentUrl);
        let content: string;
        if (contentUrl.includes(".json")) {
            const json = await contentResponse.text();
            const jsonObj = JSON.parse(
                json
                    .replace(/"listitem"/g, '"listItem"')
                    .replace(/"bulletedlist"/g, '"bulletList"')
                    .replace(/"numberedlist"/g, '"orderedList"')
                    .replace(/"codeblock"/g, '"codeBlock"')
            );
            content = `<html><body>${tiptapJSONToHTML(jsonObj)}</body></html>`;
        } else {
            content = `<html><body>${await contentResponse.text()}</body></html>`;
        }
        const window = new Window({
            url: this.originUrl,
        });
        const doc = new window.DOMParser().parseFromString(this.html, "text/html");
        const metaData = getMetaData(doc as unknown as Document);

        return {
            content: content,
            metaData: metaData,
        };
    }
}
