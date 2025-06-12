import { SearchEngine, SearchResult } from "../search.js";
import { DOMParser } from "../utils/DOMParser.js";
import { createCommonHeaders } from "../utils/createCommonHeaders.js";

async function getHTMLContent(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: createCommonHeaders(url),
    });
    return response.text();
}

export const BingEngine: SearchEngine = {
    name: "bing",
    topic: "general",
    search: async (query) => {
        const html = await getHTMLContent(`https://cn.bing.com/search?q=${encodeURIComponent(query)}`);
        const doc = new DOMParser().parseFromString(html, "text/html");

        const results: SearchResult[] = [];
        const searchResults = doc.querySelectorAll("#b_results .b_algo");

        searchResults.forEach((result) => {
            const titleElement = result.querySelector("h2 a");
            const contentElement = result.querySelector("p");

            if (titleElement && contentElement) {
                const title = titleElement.textContent?.trim() || "";
                const url = titleElement.getAttribute("href") || "";
                const description = contentElement.textContent?.trim() || "";

                results.push({
                    title,
                    url,
                    description,
                    updateTime: new Date().toISOString(),
                    metadata: {
                        source: "bing",
                    },
                });
            }
        });

        return results;
    },
};
