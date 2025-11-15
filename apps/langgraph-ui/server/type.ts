export interface LLMModel {
    model_name: string;
    provider?: string;
    base_url?: string;
    token?: string;
    messages: any[];
}
