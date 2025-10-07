interface UsageMetadataProps {
    usage_metadata: Partial<{
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
        input_token_details?: {
            cache_read?: number;
        };
    }>;
    response_metadata?: {
        model_name?: string;
    };
    spend_time?: number;
    tool_call_id?: string;
    id?: string;
}

const formatTokens = (tokens: number) => {
    return tokens.toString();
};
export const UsageMetadata: React.FC<UsageMetadataProps> = ({ usage_metadata, spend_time, response_metadata, id, tool_call_id }) => {
    const speed = spend_time ? ((usage_metadata.output_tokens || 0) * 1000) / (spend_time || 1) : 0;
    spend_time = spend_time && !isNaN(spend_time) ? spend_time : 0;
    return (
        <div className="flex items-center justify-between text-xs text-gray-400 mt-3">
            <div className="flex items-center gap-3">
                <TokenPanel usage_metadata={usage_metadata} />
                {!!spend_time && <span className="text-gray-400">{(spend_time / 1000).toFixed(2)}s</span>}
                {!!speed && <span className="text-gray-400">{speed.toFixed(2)} TPS</span>}
            </div>
            <div className="flex items-center gap-2">
                {response_metadata?.model_name && <span className="text-gray-500">{response_metadata.model_name}</span>}
                {tool_call_id && <span className="text-gray-400">Tool: {tool_call_id}</span>}
                {id && <span className="text-gray-400">ID: {id}</span>}
            </div>
        </div>
    );
};

export const TokenPanel = ({ usage_metadata }: any) => {
    return (
        <div className="flex items-center gap-1">
            <span className="flex items-center gap-1.5 group relative">
                <span className="text-xs">📊</span>
                <span className="text-gray-400">{formatTokens(usage_metadata.total_tokens || 0)}</span>
                <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg rounded-lg text-xs z-10 min-w-[280px]">
                    <div className="p-3">
                        <div className="text-sm font-medium text-gray-700 mb-3 border-b border-gray-100 pb-2">Token 使用详情</div>
                        <div className="space-y-3">
                            {/* 输入 Token */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-600">📥</span>
                                    <span className="text-gray-700 font-medium">输入 Token</span>
                                </div>
                                <span className="text-gray-900 font-mono">{formatTokens(usage_metadata.input_tokens || 0)}</span>
                            </div>

                            {/* 缓存读取 */}
                            {!!usage_metadata.input_token_details?.cache_read && (
                                <div className="flex items-center justify-between ml-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-600">💾</span>
                                        <span className="text-gray-600 text-xs">缓存读取</span>
                                    </div>
                                    <span className="text-blue-700 font-mono text-xs">{formatTokens(usage_metadata.input_token_details.cache_read)}</span>
                                </div>
                            )}

                            {/* 输出 Token */}
                            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-600">📤</span>
                                    <span className="text-gray-700 font-medium">输出 Token</span>
                                </div>
                                <span className="text-gray-900 font-mono">{formatTokens(usage_metadata.output_tokens || 0)}</span>
                            </div>

                            {/* 额外详情 */}
                            {(usage_metadata.prompt_tokens_details || usage_metadata.completion_tokens_details) && (
                                <div className="border-t border-gray-100 pt-3 mt-3">
                                    <div className="text-xs text-gray-500 mb-2">详细数据</div>
                                    <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">输入详情: {JSON.stringify(usage_metadata)}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </span>
        </div>
    );
};
