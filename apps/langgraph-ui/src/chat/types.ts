export interface Message {
    content: string;
    role: string;
    name?: string;
    metadata?: {
        graph_id?: string;
    };
    thread_id?: string;
    usage_metadata?: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
    };
    spend_time?: number;
    tool_input?: string;
}
