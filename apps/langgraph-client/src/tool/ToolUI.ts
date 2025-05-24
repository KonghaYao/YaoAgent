import { RenderMessage } from "../LangGraphClient.js";

import { LangGraphClient } from "../LangGraphClient.js";

export class ToolRenderData<D> {
    constructor(
        public message: RenderMessage,
        public client: LangGraphClient
    ) {}
    get state() {
        if (this.message.type === "tool" && this.message?.additional_kwargs?.done) {
            return "done";
        }
        return "idle";
    }
    get input() {
        try {
            return JSON.parse(this.message.tool_input!);
        } catch (e) {
            return null;
        }
    }
    response(data: D) {
        this.client.doneFEToolWaiting(this.message.id!, JSON.stringify(data));
    }
}
