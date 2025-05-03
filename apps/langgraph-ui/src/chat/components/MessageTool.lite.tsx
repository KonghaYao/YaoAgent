import { For } from "@builder.io/mitosis";
import { RenderMessage } from "@langgraph-js/sdk";
import { LangGraphClient } from "@langgraph-js/sdk";
export default function MessageTool(props: {
    message: RenderMessage;
    getMessageContent: (content: any) => string;
    formatTokens: (tokens: number) => string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    client: LangGraphClient;
}) {
    return (
        <div class="message tool">
            <div class={`tool-message ${props.isCollapsed ? "collapsed" : ""}`}>
                {props.message.name === "ask_user" && !props.message.additional_kwargs?.done && (
                    <div>
                        <div>
                            <span>问题</span>
                            <span>{props.message.tool_input}</span>
                        </div>
                        <div>
                            <input
                                type="text"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        props.client.tools.doneWaiting(props.message.id!, e.target.value);
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                <div class="tool-header" onClick={props.onToggleCollapse}>
                    <span class="tool-title">工具调用: {(props.message as any).name}</span>
                    <span class="expand-icon">▼</span>
                </div>
                <div class="tool-content">
                    <div class="tool-input">{props.message.tool_input}</div>
                    <div class="tool-output">{props.getMessageContent(props.message.content)}</div>
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
        </div>
    );
}
