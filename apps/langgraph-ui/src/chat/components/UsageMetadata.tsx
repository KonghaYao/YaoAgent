interface UsageMetadataProps {
    usage_metadata: Partial<{
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
    }>;
    spend_time?: number;
}

export const UsageMetadata: React.FC<UsageMetadataProps> = ({ usage_metadata, spend_time }) => {
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
            <span className="message-time">{spend_time ? `${(spend_time / 1000).toFixed(2)}s` : ""}</span>
        </div>
    );
};
