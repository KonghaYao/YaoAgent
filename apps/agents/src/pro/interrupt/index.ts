import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { interrupt } from "@langchain/langgraph";

export class InterruptModal {
    constructor(private inputParams: { action: "prompt" | string }) {}
    rawResponse?: {
        response: string;
        request: {
            message: string;
            action: "prompt" | string;
        };
    };
    get response(): {
        answer?: string;
    } {
        if (!this.rawResponse) throw new Error("rawResponse is undefined");
        return JSON.parse(this.rawResponse.response);
    }
    interrupt(message: string) {
        const inputData = Object.assign({ message }, this.inputParams);
        const input = JSON.stringify(inputData);
        const response = interrupt(input);
        this.rawResponse = {
            request: inputData,
            response,
        };
        return this;
    }
    isApprove() {
        return this.response.answer;
    }
    isReject() {
        return !this.response.answer;
    }
    toMessages(options?: { AIAskMessage?: boolean }) {
        if (!this.rawResponse) throw new Error("rawResponse is undefined");
        return [
            options?.AIAskMessage && new AIMessage(this.rawResponse!.request.message),
            new HumanMessage(this.response.answer!),
        ].filter(Boolean);
    }
}
