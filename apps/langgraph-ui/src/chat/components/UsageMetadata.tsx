interface UsageMetadataProps {
    usage_metadata: Partial<{
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
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
    return (
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <div className="flex items-center gap-3">
                <TokenPanel usage_metadata={usage_metadata} />
                {spend_time && <span className="text-gray-500">{(spend_time / 1000).toFixed(2)}s</span>}
                {speed && <span className="text-gray-500">{speed.toFixed(2)} TPS</span>}
            </div>
            <div className="flex items-center gap-2">
                {response_metadata?.model_name && <span className="text-gray-600">{response_metadata.model_name}</span>}
                {tool_call_id && <span className="text-gray-500">Tool: {tool_call_id}</span>}
                {id && <span className="text-gray-500">ID: {id}</span>}
            </div>
        </div>
    );
};

export const TokenPanel = ({ usage_metadata }: any) => {
    console.log(usage_metadata);
    return (
        <div className="flex items-center gap-1">
            <span className="flex items-center gap-1 group relative">
                <span>📊</span>
                {formatTokens(usage_metadata.total_tokens || 0)}
                <div className="hidden group-hover:block absolute bottom-full ml-2 bg-gray-100 p-2 rounded text-xs shadow border">
                    <div className="flex flex-col gap-1">
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1">
                                <span>📥</span>
                                {formatTokens(usage_metadata.input_tokens || 0)}
                                <div> {JSON.stringify(usage_metadata.prompt_tokens_details)}</div>
                            </span>
                            <span className="flex items-center gap-1">
                                <span>📤</span>
                                {formatTokens(usage_metadata.output_tokens || 0)}
                                <div> {JSON.stringify(usage_metadata.completion_tokens_details)}</div>
                            </span>
                        </div>
                    </div>
                </div>
            </span>
        </div>
    );
};
