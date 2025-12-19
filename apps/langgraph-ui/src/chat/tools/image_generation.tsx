import { createUITool } from "@langgraph-js/sdk";
import { z } from "zod";
import { Image, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const ImageGenerationSchema = {
    prompt: z.string().describe("prompt description"),
    input_image_urls: z.array(z.string()).optional().describe("input image urls"),
    resolution: z.enum(["1K", "2K", "4K"]).optional().default("1K").describe("image resolution"),
    aspectRatio: z.enum(["21:9", "16:9", "4:3", "3:2", "1:1", "9:16", "3:4", "2:3", "5:4", "4:5"]).optional().default("16:9").describe("image aspect ratio"),
    model: z.string().optional().default("gemini-3-pro-image-preview").describe("model name"),
};

export const image_generation = createUITool({
    name: "image_generation",
    description: "Generate or edit an image.",
    parameters: ImageGenerationSchema,
    onlyRender: true,
    render(tool) {
        const data = tool.getInputRepaired();
        const [imageUrls, setImageUrls] = useState<string[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string>("");

        useEffect(() => {
            // 处理输出，可能是字符串或数组
            const output = tool.getJSONOutputSafe();
            if (output) {
                try {
                    if (typeof output === "string") {
                        // 尝试解析 JSON
                        const parsed = JSON.parse(output);
                        if (parsed.image_url) {
                            setImageUrls(Array.isArray(parsed.image_url) ? parsed.image_url : [parsed.image_url]);
                        } else if (Array.isArray(parsed)) {
                            setImageUrls(parsed);
                        } else {
                            setImageUrls([output]);
                        }
                    } else if (Array.isArray(output)) {
                        setImageUrls(output);
                    } else if (output.image_url) {
                        setImageUrls(Array.isArray(output.image_url) ? output.image_url : [output.image_url]);
                    }
                    setLoading(false);
                } catch (e) {
                    // 如果不是 JSON，直接作为 URL
                    setImageUrls([output]);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        }, [tool.output]);

        const isEditing = data.input_image_urls && data.input_image_urls.length > 0;

        return (
            <div className="w-[70%] my-1 border border-gray-200 bg-white shadow-none rounded-xl overflow-hidden">
                <div className="pb-2 p-3 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">{isEditing ? "Image Editing" : "Image Generation"}</h3>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    {/* Prompt */}
                    <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Prompt</div>
                        <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200">{data.prompt}</div>
                    </div>

                    {/* Reference Images */}
                    {isEditing && data.input_image_urls && data.input_image_urls.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">Reference Images</div>
                            <div className="flex flex-wrap gap-2">
                                {data.input_image_urls.map((url, index) => (
                                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                        <img src={url} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Configuration */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                            <span className="font-medium">Resolution:</span>
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{data.resolution || "1K"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium">Aspect Ratio:</span>
                            <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded">{data.aspectRatio || "16:9"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-medium">Model:</span>
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded truncate max-w-[200px]">{data.model || "gemini-3-pro-image-preview"}</span>
                        </div>
                    </div>

                    {/* Generated Images */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                            <div className="text-sm text-gray-600">Generating image...</div>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
                    ) : imageUrls.length > 0 ? (
                        <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">Generated Images</div>
                            <div
                                className={cn(
                                    "grid gap-4",
                                    imageUrls.length === 1 ? "grid-cols-1" : imageUrls.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                )}
                            >
                                {imageUrls.map((url, index) => (
                                    <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                        <img src={url} alt={`Generated image ${index + 1}`} className="w-full h-auto object-contain" onError={() => setError(`Failed to load image ${index + 1}`)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                            <Image className="w-8 h-8 text-gray-400 mb-2" />
                            <div className="text-sm text-gray-600">No images generated yet</div>
                        </div>
                    )}
                </div>
            </div>
        );
    },
});
