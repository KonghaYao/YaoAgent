#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const CONTEXT7_API_BASE_URL = "https://context7.com/api";
const DEFAULT_TYPE = "txt";
export interface SearchResult {
    id: string;
    title: string;
    description: string;
    branch: string;
    lastUpdateDate: string;
    state: DocumentState;
    totalTokens: number;
    totalSnippets: number;
    totalPages: number;
    stars?: number;
    trustScore?: number;
    versions?: string[];
}

export interface SearchResponse {
    results: SearchResult[];
}

// Version state is still needed for validating search results
export type DocumentState = "initial" | "finalized" | "error" | "delete";
/**
 * Searches for libraries matching the given query
 * @param query The search query
 * @returns Search results or null if the request fails
 */
export async function searchLibraries(query: string): Promise<SearchResponse | null> {
    try {
        const url = new URL(`${CONTEXT7_API_BASE_URL}/v1/search`);
        url.searchParams.set("query", query);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to search libraries: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("Error searching libraries:", error);
        return null;
    }
}

/**
 * Fetches documentation context for a specific library
 * @param libraryId The library ID to fetch documentation for
 * @param options Options for the request
 * @returns The documentation text or null if the request fails
 */
export async function fetchLibraryDocumentation(
    libraryId: string,
    options: {
        tokens?: number;
        topic?: string;
        userQuery?: string;
    } = { userQuery: "" }
): Promise<string | null> {
    try {
        if (libraryId.startsWith("/")) {
            libraryId = libraryId.slice(1);
        }
        const url = new URL(`${CONTEXT7_API_BASE_URL}/v1/${libraryId}`);
        if (options.tokens) url.searchParams.set("tokens", options.tokens.toString());
        if (options.topic) url.searchParams.set("topic", options.topic);
        url.searchParams.set("type", DEFAULT_TYPE);
        const response = await fetch(url, {
            headers: {
                "X-Context7-Source": "mcp-server",
                "X-Context7-User-Query": options.userQuery?.trim().toLowerCase() || "",
            },
        });
        if (!response.ok) {
            console.error(`Failed to fetch documentation: ${response.status}`);
            return null;
        }
        const text = await response.text();
        if (!text || text === "No content available" || text === "No context data available") {
            return null;
        }
        return text;
    } catch (error) {
        console.error("Error fetching library documentation:", error);
        return null;
    }
}

/**
 * Formats a search result into a human-readable string representation.
 * Only shows code snippet count and GitHub stars when available (not equal to -1).
 *
 * @param result The SearchResult object to format
 * @returns A formatted string with library information
 */
export function formatSearchResult(result: SearchResult): string {
    // Always include these basic details
    const formattedResult = [
        `- Title: ${result.title}`,
        `- Context7-compatible library ID: ${result.id}`,
        `- Description: ${result.description}`,
    ];

    // Only add code snippets count if it's a valid value
    if (result.totalSnippets !== -1 && result.totalSnippets !== undefined) {
        formattedResult.push(`- Code Snippets: ${result.totalSnippets}`);
    }

    // Only add trust score if it's a valid value
    if (result.trustScore !== -1 && result.trustScore !== undefined) {
        formattedResult.push(`- Trust Score: ${result.trustScore}`);
    }

    // Only add versions if it's a valid value
    if (result.versions !== undefined && result.versions.length > 0) {
        formattedResult.push(`- Versions: ${result.versions.join(", ")}`);
    }

    // Join all parts with newlines
    return formattedResult.join("\n");
}

/**
 * Formats a search response into a human-readable string representation.
 * Each result is formatted using formatSearchResult.
 *
 * @param searchResponse The SearchResponse object to format
 * @returns A formatted string with search results
 */
export function formatSearchResults(searchResponse: SearchResponse): string {
    if (!searchResponse.results || searchResponse.results.length === 0) {
        return "No documentation libraries found matching your query.";
    }

    const formattedResults = searchResponse.results.map(formatSearchResult);
    return formattedResults.join("\n----------\n");
}

// Get DEFAULT_MINIMUM_TOKENS from environment variable or use default
let DEFAULT_MINIMUM_TOKENS = 10000;
if (process.env.DEFAULT_MINIMUM_TOKENS) {
    const parsedValue = parseInt(process.env.DEFAULT_MINIMUM_TOKENS, 10);
    if (!isNaN(parsedValue) && parsedValue > 0) {
        DEFAULT_MINIMUM_TOKENS = parsedValue;
    } else {
        console.warn(
            `Warning: Invalid DEFAULT_MINIMUM_TOKENS value provided in environment variable. Using default value of 10000`
        );
    }
}

// Create server instance
const server = new McpServer({
    name: "Context7",
    description: "Retrieves up-to-date documentation and code examples for any library.",
    version: "1.0.6",
    capabilities: {
        resources: {},
        tools: {},
    },
});

// Register Context7 tools
server.tool(
    "resolve-library-id",
    `Resolves a package/product name to a Context7-compatible library ID and returns a list of matching libraries.

You MUST call this function before 'get-library-docs' to obtain a valid Context7-compatible library ID UNLESS the user explicitly provides a library ID in the format '/org/project' or '/org/project/version' in their query.

Selection Process:
1. Analyze the query to understand what library/package the user is looking for
2. Return the most relevant match based on:
- Name similarity to the query (exact matches prioritized)
- Description relevance to the query's intent
- Documentation coverage (prioritize libraries with higher Code Snippet counts)
- Trust score (consider libraries with scores of 7-10 more authoritative)

Response Format:
- Return the selected library ID in a clearly marked section
- Provide a brief explanation for why this library was chosen
- If multiple good matches exist, acknowledge this but proceed with the most relevant one
- If no good matches exist, clearly state this and suggest query refinements

For ambiguous queries, request clarification before proceeding with a best-guess match.`,
    {
        libraryName: z.string().describe("Library name to search for and retrieve a Context7-compatible library ID."),
    },
    async ({ libraryName }) => {
        const searchResponse = await searchLibraries(libraryName);

        if (!searchResponse || !searchResponse.results) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Failed to retrieve library documentation data from Context7",
                    },
                ],
            };
        }

        if (searchResponse.results.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: "No documentation libraries available",
                    },
                ],
            };
        }

        const resultsText = formatSearchResults(searchResponse);

        return {
            content: [
                {
                    type: "text",
                    text: `Available Libraries (top matches):

Each result includes:
- Library ID: Context7-compatible identifier (format: /org/project)
- Name: Library or package name
- Description: Short summary
- Code Snippets: Number of available code examples
- Trust Score: Authority indicator
- Versions: List of versions if available. Use one of those versions if and only if the user explicitly provides a version in their query.

For best results, select libraries based on name match, trust score, snippet coverage, and relevance to your use case.

----------

${resultsText}`,
                },
            ],
        };
    }
);

server.tool(
    "get-library-docs",
    "Fetches up-to-date documentation for a library. You must call 'resolve-library-id' first to obtain the exact Context7-compatible library ID required to use this tool, UNLESS the user explicitly provides a library ID in the format '/org/project' or '/org/project/version' in their query.",
    {
        context7CompatibleLibraryID: z
            .string()
            .describe(
                "Exact Context7-compatible library ID (e.g., '/mongodb/docs', '/vercel/next.js', '/supabase/supabase', '/vercel/next.js/v14.3.0-canary.87') retrieved from 'resolve-library-id' or directly from user query in the format '/org/project' or '/org/project/version'."
            ),
        topic: z.string().optional().describe("Topic to focus documentation on (e.g., 'hooks', 'routing')."),
        tokens: z
            .preprocess((val) => (typeof val === "string" ? Number(val) : val), z.number())
            .transform((val) => (val < DEFAULT_MINIMUM_TOKENS ? DEFAULT_MINIMUM_TOKENS : val))
            .optional()
            .describe(
                `Maximum number of tokens of documentation to retrieve (default: ${DEFAULT_MINIMUM_TOKENS}). Higher values provide more context but consume more tokens.`
            ),
        userQuery: z
            .string()
            .describe(
                "Initial user query that triggered this tool call. Provide the user query as it is. Do not modify it or change it in any way. Do not add any additional information to the query."
            ),
    },
    async ({ context7CompatibleLibraryID, tokens = DEFAULT_MINIMUM_TOKENS, topic = "", userQuery }) => {
        const documentationText = await fetchLibraryDocumentation(context7CompatibleLibraryID, {
            tokens,
            topic,
            userQuery,
        });

        if (!documentationText) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Documentation not found or not finalized for this library. This might have happened because you used an invalid Context7-compatible library ID. To get a valid Context7-compatible library ID, use the 'resolve-library-id' with the package name you wish to retrieve documentation for.",
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: documentationText,
                },
            ],
        };
    }
);

export default server;
