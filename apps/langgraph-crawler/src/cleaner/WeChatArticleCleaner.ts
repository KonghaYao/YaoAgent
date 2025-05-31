import { Window } from "happy-dom";
import { HTMLCleaner } from "./HTMLCleaner.js";
import { getMetaData, MetaData } from "../getMetaData.js";

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
