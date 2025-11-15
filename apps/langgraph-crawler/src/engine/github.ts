import { getHTMLContent } from "../extract.js";
import { SearchEngine, SearchEngineResult } from "../search.js";
import { getDocument } from "../utils/DOMParser.js";
export const GithubEngine: SearchEngine = {
    name: "github",
    topic: "code",
    search: async (query) => {
        const html = await getHTMLContent(`https://github.com/search?q=${encodeURIComponent(query)}&type=repositories`);

        // 使用DOMParser解析HTML
        const doc = await getDocument(html, "https://github.com/search?q=${encodeURIComponent(query)}&type=repositories");

        const results: SearchEngineResult[] = [];

        // 备用方案：使用DOM解析
        const repoItems = doc.querySelector("[data-testid='results-list']")?.children;

        repoItems &&
            [...repoItems].forEach((item) => {
                const titleElement = item.querySelector("h3");
                const aElement = titleElement?.querySelector("a");
                const descriptionElement = item.querySelector("h3+div");
                const tagsElement = item.querySelector("h3+div+div");
                const metadataElement = item.querySelector("ul");
                const updateTime = item.querySelector("ul [title]");
                const title = titleElement?.textContent?.trim() || "未知仓库";
                const url = aElement?.getAttribute("href") || "";
                const description = descriptionElement?.textContent?.trim() || "";
                const tags = [...(tagsElement?.children || [])].map((child) => child.textContent?.trim() || "").join(",");

                results.push({
                    title: title,
                    url: url,
                    description: description + "\n" + tags + "\n" + metadataElement?.textContent?.trim(),
                    updateTime: new Date(updateTime?.getAttribute("title") as string).toISOString(),
                });
            });

        return results;
    },
};
