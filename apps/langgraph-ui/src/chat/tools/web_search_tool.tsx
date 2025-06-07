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

// 出参[{"engine":"basic","results":[{"title":"What is Google Gemini? Features, Usage and Limitations","url":"https://www.analyticsvidhya.com/blog/2023/12/what-is-google-gemini-features-usage-and-limitations","description":"10. 1. 2025 — Explore Google Gemini ai features, multimodality, advanced coding, and limitations. Learn how it compares to other LLMs in AI. Read Now !","updateTime":"2025-06-06T12:22:46.944Z","metadata":{"engines":["google"]}},{"title":"Gemini: A Revolutionary AI Model. Introduction | by Tamanna","url":"https://medium.com/@tam.tamanna18/gemini-a-revolutionary-ai-model-431216f177d3","description":"One of the standout features of GEMINI is its colossal token size. This attribute empowers the model to process and assimilate vast amounts of ...","updateTime":"2025-06-06T12:22:46.944Z","metadata":{"engines":["google"]}},{"title":"ChatGPT vs Gemini vs Claude: Comparing Top AI Models ...","url":"https://weam.ai/blog/guide/chatgpt-vs-gemini-vs-claude","description":"28. 1. 2025 — Offers unique features that most competitors lack, such as modifying responses for length, tone, or style, and showing multiple drafts of a ...","updateTime":"2025-06-06T12:22:46.944Z","metadata":{"engines":["google"]}},{"title":"What advantages do diffusion models offer over other ...","url":"https://milvus.io/ai-quick-reference/what-advantages-do-diffusion-models-offer-over-other-generative-methods","description":"Diffusion models provide three key advantages over other generative methods: high-quality output generation, stable training dynamics, and flexibility in ...","updateTime":"2025-06-06T12:22:46.944Z","metadata":{"engines":["google"]}},{"title":"ChatGPT vs Gemini, advantages and disadvantages","url":"https://ddigitals.net/en/blog/digital-marketing/chatpgt-vs-gemini","description":"11. 6. 2024 — We will explore the advantages and disadvantages of ChatGPT to help you make informed decisions about their implementation in your marketing strategy.","updateTime":"2025-06-06T12:22:46.944Z","metadata":{"engines":["google"]}},{"title":"Compare generative AI vs. LLMs: Differences and use cases","url":"https://www.techtarget.com/searchenterpriseai/tip/Compare-large-language-models-vs-generative-AI","description":"13. 2. 2025 — Explore the differences between large language models and generative AI, including model architecture, use cases, training data needs and ...","updateTime":"2025-06-06T12:22:46.944Z","metadata":{"engines":["google"]}},{"title":"Artificial-Intelligence-Generated Content with Diffusion ...","url":"https://www.mdpi.com/2227-7390/12/7/977","description":"autor: X Wang · 2024 · Počet citací tohoto článku: 18 — Another key advantage of GAN models relative to diffusion models is th

export const web_search_tool = createToolUI({
    name: "web_search_tool",
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
