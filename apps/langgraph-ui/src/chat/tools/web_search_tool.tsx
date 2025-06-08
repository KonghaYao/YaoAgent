// 入参 {"query":"Gemini Diffusion vs other diffusion models advantages disadvantages unique features"}

import { createToolUI, ToolRenderData } from "@langgraph-js/sdk";
import { LinkIcon } from "lucide-react";
import { useState } from "react";

interface SearchResult {
    title: string;
    url: string;
    description: string;
    updateTime: string;
    metadata: {
        engines: string[];
    };
}

interface RenderResponse {
    engine: string;
    results: SearchResult[];
}

interface SearchInput {
    query: string;
}

export const web_search_tool = createToolUI({
    name: "web_search",
    description:
        "A powerful web search tool that provides comprehensive, real-time results using search engine. Returns relevant web content with customizable parameters for result count, content type, and domain filtering. Ideal for gathering current information, news, and detailed web content analysis.",
    parameters: [],
    onlyRender: true,
    render(tool: ToolRenderData<SearchInput, RenderResponse[]>) {
        const data = tool.getInputRepaired();
        const feedback = tool.getJSONOutputSafe()?.flatMap((i) => i.results) || [];
        const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

        const toggleExpand = (index: number) => {
            const newExpanded = new Set(expandedItems);
            if (newExpanded.has(index)) {
                newExpanded.delete(index);
            } else {
                newExpanded.add(index);
            }
            setExpandedItems(newExpanded);
        };

        const openLink = (url: string) => {
            window.open(url, "_blank", "noopener,noreferrer");
        };

        return (
            <div className="p-4 space-y-4">
                <div className="text-sm text-gray-500">
                    Search Query: {data.query}；Get {feedback.length} results
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {feedback.map((result, index) => (
                        <div key={index} className="border rounded-lg p-2 hover:bg-gray-50">
                            <div className="flex items-center justify-between select-none cursor-pointer" onClick={() => toggleExpand(index)}>
                                <span className="font-xs flex-1">{result.title}</span>
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openLink(result.url);
                                    }}
                                    className="px-3 py-1 text-sm"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                </div>
                                <span className="text-gray-400">{expandedItems.has(index) ? "▼" : "▶"}</span>
                            </div>

                            {expandedItems.has(index) && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-sm text-gray-600">{result.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{new Date(result.updateTime).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{result.metadata.engines.join(", ")}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    },
});
