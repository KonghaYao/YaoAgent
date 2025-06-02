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

export const UsageMetadata: React.FC<UsageMetadataProps> = ({ usage_metadata, spend_time, response_metadata, id, tool_call_id }) => {
    const formatTokens = (tokens: number) => {
        return tokens.toString();
    };

    return (
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                    <span>📥</span>
                    {formatTokens(usage_metadata.input_tokens || 0)}
                </span>
                <span className="flex items-center gap-1">
                    <span>📤</span>
                    {formatTokens(usage_metadata.output_tokens || 0)}
                </span>
                <span className="flex items-center gap-1">
                    <span>📊</span>
                    {formatTokens(usage_metadata.total_tokens || 0)}
                </span>
            </div>
            <div className="flex items-center gap-2">
                {response_metadata?.model_name && <span className="text-gray-600">{response_metadata.model_name}</span>}
                {spend_time && <span className="text-gray-500">{(spend_time / 1000).toFixed(2)}s</span>}
                {tool_call_id && <span className="text-gray-500">Tool: {tool_call_id}</span>}
                {id && <span className="text-gray-500">ID: {id}</span>}
            </div>
        </div>
    );
};
