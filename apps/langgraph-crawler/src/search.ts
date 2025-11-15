import { z } from "zod";
import { NpmEngine } from "./engine/npm.js";
import { BasicEngine } from "./engine/basic.js";
import { JuejinEngine } from "./engine/juejin.js";
import { AnthropicEngine } from "./engine/authropic.js";
import { GithubEngine } from "./engine/github.js";
import { BingEngine } from "./engine/bing.js";

export const SearchSchema = z.object({
    query: z.string().describe("The search query to execute with Tavily."),
    auto_parameters: z
        .boolean()
        .optional()
        .describe(
            "When `auto_parameters` is enabled, Tavily automatically configures search parameters based on your query's content and intent. You can still set other parameters manually, and your explicit values will override the automatic ones. The parameters `include_answer`, `include_raw_content`, and `max_results` must always be set manually, as they directly affect response size. Note: `search_depth` may be automatically set to advanced when it's likely to improve results. This uses 2 API credits per request. To avoid the extra cost, you can explicitly set `search_depth` to `basic`. Currently in beta."
        ),
    topic: z
        .enum(["general", "news", "finance"])
        .optional()
        .describe(
            "The category of the search.`news` is useful for retrieving real-time updates, particularly about politics, sports, and major current events covered by mainstream media sources. `general` is for broader, more general-purpose searches that may include a wide range of sources."
        ),
    search_depth: z
        .enum(["basic", "advanced"])
        .optional()
        .describe(
            "The depth of the search. `advanced` search is tailored to retrieve the most relevant sources and `content` snippets for your query, while `basic` search provides generic content snippets from each source. A `basic` search costs 1 API Credit, while an `advanced` search costs 2 API Credits."
        ),
    chunks_per_source: z
        .number()
        .int()
        .min(1)
        .max(3)
        .optional()
        .describe(
            "Chunks are short content snippets (maximum 500 characters each) pulled directly from the source. Use `chunks_per_source` to define the maximum number of relevant chunks returned per source and to control the `content` length. Chunks will appear in the `content` field as: `<chunk 1> [...] <chunk 2> [...] <chunk 3>`. Available only when `search_depth` is `advanced`."
        ),
    max_results: z.number().int().min(0).max(20).optional().describe("The maximum number of search results to return."),
    time_range: z
        .enum(["day", "week", "month", "year", "d", "w", "m", "y"])
        .nullable()
        .optional()
        .describe("The time range back from the current date to filter results based on publish date or last updated date. Useful when looking for sources that have published or updated data."),
    start_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional()
        .describe("Will return all results after the specified start date based on publish date or last updated date. Required to be written in the format YYYY-MM-DD"),
    end_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional()
        .describe("Will return all results before the specified end date based on publish date or last updated date. Required to be written in the format YYYY-MM-DD"),
    include_answer: z
        .union([z.boolean(), z.enum(["basic", "advanced"])])
        .optional()
        .describe("Include an LLM-generated answer to the provided query. `basic` or `true` returns a quick answer. `advanced` returns a more detailed answer."),
    include_raw_content: z
        .union([z.boolean(), z.enum(["markdown", "text"])])
        .optional()
        .describe(
            "Include the cleaned and parsed HTML content of each search result. `markdown` or `true` returns search result content in markdown format. `text` returns the plain text from the results and may increase latency."
        ),
    include_images: z.boolean().optional().describe("Also perform an image search and include the results in the response."),
    include_image_descriptions: z.boolean().optional().describe("When `include_images` is `true`, also add a descriptive text for each image."),
    include_favicon: z.boolean().optional().describe("Whether to include the favicon URL for each result."),
    include_domains: z.array(z.string()).optional().describe("A list of domains to specifically include in the search results. Maximum 300 domains."),
    exclude_domains: z.array(z.string()).optional().describe("A list of domains to specifically exclude from the search results. Maximum 150 domains."),
    country: z
        .enum([
            "afghanistan",
            "albania",
            "algeria",
            "andorra",
            "angola",
            "argentina",
            "armenia",
            "australia",
            "austria",
            "azerbaijan",
            "bahamas",
            "bahrain",
            "bangladesh",
            "barbados",
            "belarus",
            "belgium",
            "belize",
            "benin",
            "bhutan",
            "bolivia",
            "bosnia and herzegovina",
            "botswana",
            "brazil",
            "brunei",
            "bulgaria",
            "burkina faso",
            "burundi",
            "cambodia",
            "cameroon",
            "canada",
            "cape verde",
            "central african republic",
            "chad",
            "chile",
            "china",
            "colombia",
            "comoros",
            "congo",
            "costa rica",
            "croatia",
            "cuba",
            "cyprus",
            "czech republic",
            "denmark",
            "djibouti",
            "dominican republic",
            "ecuador",
            "egypt",
            "el salvador",
            "equatorial guinea",
            "eritrea",
            "estonia",
            "ethiopia",
            "fiji",
            "finland",
            "france",
            "gabon",
            "gambia",
            "georgia",
            "germany",
            "ghana",
            "greece",
            "guatemala",
            "guinea",
            "haiti",
            "honduras",
            "hungary",
            "iceland",
            "india",
            "indonesia",
            "iran",
            "iraq",
            "ireland",
            "israel",
            "italy",
            "jamaica",
            "japan",
            "jordan",
            "kazakhstan",
            "kenya",
            "kuwait",
            "kyrgyzstan",
            "latvia",
            "lebanon",
            "lesotho",
            "liberia",
            "libya",
            "liechtenstein",
            "lithuania",
            "luxembourg",
            "madagascar",
            "malawi",
            "malaysia",
            "maldives",
            "mali",
            "malta",
            "mauritania",
            "mauritius",
            "mexico",
            "moldova",
            "monaco",
            "mongolia",
            "montenegro",
            "morocco",
            "mozambique",
            "myanmar",
            "namibia",
            "nepal",
            "netherlands",
            "new zealand",
            "nicaragua",
            "niger",
            "nigeria",
            "north korea",
            "north macedonia",
            "norway",
            "oman",
            "pakistan",
            "panama",
            "papua new guinea",
            "paraguay",
            "peru",
            "philippines",
            "poland",
            "portugal",
            "qatar",
            "romania",
            "russia",
            "rwanda",
            "saudi arabia",
            "senegal",
            "serbia",
            "singapore",
            "slovakia",
            "slovenia",
            "somalia",
            "south africa",
            "south korea",
            "south sudan",
            "spain",
            "sri lanka",
            "sudan",
            "sweden",
            "switzerland",
            "syria",
            "taiwan",
            "tajikistan",
            "tanzania",
            "thailand",
            "togo",
            "trinidad and tobago",
            "tunisia",
            "turkey",
            "turkmenistan",
            "uganda",
            "ukraine",
            "united arab emirates",
            "united kingdom",
            "united states",
            "uruguay",
            "uzbekistan",
            "venezuela",
            "vietnam",
            "yemen",
            "zambia",
            "zimbabwe",
        ])
        .nullable()
        .optional()
        .describe("Boost search results from a specific country. This will prioritize content from the selected country in the search results. Available only if topic is `general`."),
});

export const SearchResultSchema = z.object({
    title: z.string().describe("The title of the search result."),
    url: z.string().describe("The URL of the search result."),
    content: z.string().describe("A short description of the search result."),
    score: z.number().describe("The relevance score of the search result."),
    raw_content: z.string().optional().describe("The cleaned and parsed HTML content of the search result. Only if `include_raw_content` is true."),
    favicon: z.string().optional().describe("The favicon URL for the result."),
});

export const ImageResultSchema = z.object({
    url: z.string().describe("The URL of the image."),
    description: z.string().optional().describe("The description of the image. Only included if `include_image_descriptions` is true."),
});

export const AutoParametersSchema = z.object({
    topic: z.string().optional(),
    search_depth: z.string().optional(),
});

export const SearchResponseSchema = z.object({
    query: z.string().describe("The search query that was executed."),
    answer: z.string().optional().describe("A short answer to the user's query, generated by an LLM. Included in the response only if `include_answer` is requested."),
    images: z.array(ImageResultSchema).optional().describe("List of query-related images. If `include_image_descriptions` is true, each item will have `url` and `description`."),
    results: z.array(SearchResultSchema).describe("A list of sorted search results, ranked by relevancy."),
    auto_parameters: AutoParametersSchema.optional().describe("A dictionary of the selected auto_parameters, only shown when `auto_parameters` is true."),
    response_time: z.number().describe("Time in seconds it took to complete the request."),
    request_id: z.string().describe("A unique request identifier you can share with customer support to help resolve issues with specific requests."),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;
export type ImageResult = z.infer<typeof ImageResultSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export interface SearchEngineResult {
    title: string;
    url: string;
    description: string;
    updateTime: string;
    metadata?: Record<string, any>;
}
export interface SearchEngine {
    name: string;
    topic: string;
    search: (query: string) => Promise<SearchEngineResult[]>;
}

const SupportedEngines = [BasicEngine, JuejinEngine, NpmEngine, AnthropicEngine, GithubEngine, BingEngine];

/** Tavily-compatible search interface */
export async function search(params: z.infer<typeof SearchSchema>): Promise<SearchResponse> {
    // Validate input parameters
    const validation = SearchSchema.safeParse(params);
    if (!validation.success) {
        throw new Error(`Invalid search parameters: ${validation.error.message}`);
    }

    const startTime = Date.now();

    // Apply defaults
    const normalizedParams = {
        auto_parameters: false,
        topic: "general" as const,
        search_depth: "basic" as const,
        chunks_per_source: 3,
        max_results: 5,
        time_range: null,
        start_date: null,
        end_date: null,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
        include_image_descriptions: false,
        include_favicon: false,
        include_domains: [],
        exclude_domains: [],
        country: null,
        ...params,
    };

    // Map topic to engines
    const engines = getEnginesForTopic(normalizedParams.topic);

    // Execute search using existing engines
    const engineResults = await Promise.all(
        engines.map(async (engine) => {
            try {
                return await engine.search(normalizedParams.query);
            } catch (error) {
                console.warn(`Engine ${engine.name} failed:`, error);
                return [];
            }
        })
    );

    // Flatten and limit results
    const allResults = engineResults.flat().slice(0, normalizedParams.max_results);

    // Convert to Tavily format
    const results: SearchResult[] = allResults.map((result, index) => ({
        title: result.title,
        url: result.url,
        content: result.description || result.title, // Map description to content
        score: 1.0 - index * 0.1, // Simple scoring based on order
        raw_content: normalizedParams.include_raw_content ? undefined : undefined, // Not supported by current engines
        favicon: normalizedParams.include_favicon ? undefined : undefined, // Not supported by current engines
    }));

    const responseTime = (Date.now() - startTime) / 1000;

    const response: SearchResponse = {
        query: normalizedParams.query,
        results,
        response_time: responseTime,
        request_id: generateRequestId(),
        // Optional fields based on parameters
        ...(normalizedParams.include_answer && { answer: undefined }), // Not implemented
        ...(normalizedParams.include_images && { images: [] }), // Not implemented
        ...(normalizedParams.auto_parameters && { auto_parameters: {} }), // Not implemented
    };

    return response;
}

function getEnginesForTopic(topic: string): typeof SupportedEngines {
    switch (topic) {
        case "news":
            return [BingEngine]; // Bing is good for news
        case "finance":
            return [BingEngine]; // Bing for finance
        case "general":
        default:
            return [BingEngine, BasicEngine]; // General search with multiple engines
    }
}

function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
