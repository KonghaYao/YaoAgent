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
        <div className="message-meta">
            <div className="token-info">
                <span className="token-item">
                    <span className="token-emoji">📥</span>
                    {formatTokens(usage_metadata.input_tokens || 0)}
                </span>
                <span className="token-item">
                    <span className="token-emoji">📤</span>
                    {formatTokens(usage_metadata.output_tokens || 0)}
                </span>
                <span className="token-item">
                    <span className="token-emoji">📊</span>
                    {formatTokens(usage_metadata.total_tokens || 0)}
                </span>
            </div>
            <div>{response_metadata?.model_name}</div>
            <span className="message-time">{spend_time ? `${(spend_time / 1000).toFixed(2)}s` : ""}</span>
            {tool_call_id && <span className="tool-call-id">Tool: {tool_call_id}</span>}
            {id && <span className="message-id">ID: {id}</span>}
        </div>
    );
};
