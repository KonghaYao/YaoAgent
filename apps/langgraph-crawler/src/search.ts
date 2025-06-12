import { z } from "zod";
import { NpmEngine } from "./engine/npm.js";
import { BasicEngine } from "./engine/basic.js";
import { JuejinEngine } from "./engine/juejin.js";
import { AnthropicEngine } from "./engine/authropic.js";
import { GithubEngine } from "./engine/github.js";
import { BingEngine } from "./engine/bing.js";

export const SearchSchema = z.object({
    query: z.string().describe("the query to search"),
    // topic: z.enum(["news", "code"]).default("news").describe("the topic to search"),
    engines: z
        .array(z.enum(["basic", "npm", "juejin", "anthropic", "github", "bing"]))
        .default(["bing"])
        .describe("the engines to use"),
    returnType: z.enum(["json", "markdown"]).default("json").describe("the content type to return"),
    withMetadata: z.boolean().default(true).describe("whether to include metadata in the search results"),
});

export const SearchResultSchema = z.object({
    title: z.string().describe("the title of the search result"),
    url: z.string().describe("the url of the search result"),
    description: z.string().describe("the description of the search result"),
    updateTime: z.string().describe("the update time of the search result"),
    metadata: z.record(z.string(), z.any()).optional().describe("the metadata of the search result"),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export interface SearchEngine {
    name: string;
    topic: string;
    search: (query: string) => Promise<SearchResult[]>;
}

const SupportedEngines = [BasicEngine, JuejinEngine, NpmEngine, AnthropicEngine, GithubEngine, BingEngine];
/** 聚合搜索接口，提供可扩展的多个数据源接入 */
export async function search({ query, engines, returnType, withMetadata }: z.infer<typeof SearchSchema>): Promise<
    | {
          engine: string;
          results: SearchResult[];
      }[]
    | string
> {
    const topicSupportedEngine = SupportedEngines.filter((engine) => engines.includes(engine.name as any));
    if (topicSupportedEngine.length === 0) {
        throw new Error("No engines found for topic");
    }
    const results = await Promise.all(
        topicSupportedEngine.map(async (engine) => {
            return {
                engine: engine.name,
                results: await engine.search(query),
            };
        })
    );
    if (!withMetadata) {
        results.forEach(({ results }) =>
            results.map((result) => {
                delete result.metadata;
            })
        );
    }
    if (returnType === "markdown") {
        return resultsToMarkdown(results);
    } else {
        return results;
    }
}

const resultsToMarkdown = (
    results: {
        engine: string;
        results: SearchResult[];
    }[]
) => {
    return results
        .map(({ engine, results }) =>
            results.map(
                (result) => `## [${result.title}](${result.url})
from_engine: ${engine}
${result.description}${result.metadata ? "\n" + JSON.stringify(result.metadata) : ""}`
            )
        )
        .flat()
        .join("\n\n---\n\n");
};
