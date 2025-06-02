import { SearchEngine, SearchResult } from "../search.js";
import { DOMParser } from "../utils/DOMParser.js";
import { createCommonHeaders } from "../utils/createCommonHeaders.js";

async function getHTMLContent(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: createCommonHeaders(url),
    });
    return response.text();
}

export const BasicEngine: SearchEngine = {
    name: "basic",
    topic: "news",
    search: async (query) => {
        const html = await getHTMLContent(
            `${process.env.SEARCH_ENGINE_URL || "https://searx.bndkt.io"}/search?q=${encodeURIComponent(query)}&safesearch=0&category_general=1&pageno=1&theme=simple&language=all`
        );
        const doc = new DOMParser().parseFromString(html, "text/html");

        const results: SearchResult[] = [];
        const articles = doc.querySelectorAll("#urls article.result");

        articles.forEach((article) => {
            const titleElement = article.querySelector("h3 a");
            const urlElement = article.querySelector("a.url_header");
            const contentElement = article.querySelector("p.content");
            const enginesElement = article.querySelector("div.engines");

            if (titleElement && urlElement && contentElement) {
                const title = titleElement.textContent?.trim() || "";
                const url = urlElement.getAttribute("href") || "";
                const description = contentElement.textContent?.trim() || "";
                const engines = Array.from(enginesElement?.querySelectorAll("span") || [])
                    .map((span) => span.textContent?.trim())
                    .filter(Boolean);

                results.push({
                    title,
                    url,
                    description,
                    updateTime: new Date().toISOString(),
                    metadata: {
                        engines,
                    },
                });
            }
        });

        return results;
    },
};
