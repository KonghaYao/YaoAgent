import { For } from "@builder.io/mitosis";
import { RenderMessage } from "@langgraph-js/sdk";

export default function MessageAI(props: { message: RenderMessage; getMessageContent: (content: any) => string; formatTokens: (tokens: number) => string }) {
    return (
        <div class="message ai">
            <div class="message-content">
                <div class="message-text">{props.getMessageContent(props.message.content)}</div>
                <div class="message-meta">
                    <span class="message-time">{props.message.spend_time ? `${(props.message.spend_time / 1000).toFixed(2)}s` : ""}</span>
                    {props.message.usage_metadata && (
                        <div class="token-info">
                            <span class="token-item">
                                <span class="token-emoji">📥</span>
                                {props.formatTokens(props.message.usage_metadata.input_tokens)}
                            </span>
                            <span class="token-item">
                                <span class="token-emoji">📤</span>
                                {props.formatTokens(props.message.usage_metadata.output_tokens)}
                            </span>
                            <span class="token-item">
                                <span class="token-emoji">📊</span>
                                {props.formatTokens(props.message.usage_metadata.total_tokens)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
