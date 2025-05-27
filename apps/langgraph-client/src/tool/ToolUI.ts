import { RenderMessage } from "../LangGraphClient.js";

import { LangGraphClient } from "../LangGraphClient.js";
import { getMessageContent } from "../ui-store/createChatStore.js";

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
    get output() {
        return getMessageContent(this.message.content);
    }
    getJSONOutput() {
        return JSON.parse(this.output);
    }
    /** 如果解析失败，则返回 null */
    getJSONOutputSafe() {
        try {
            return JSON.parse(this.output);
        } catch (e) {
            return null;
        }
    }
    response(data: D) {
        this.client.doneFEToolWaiting(this.message.id!, JSON.stringify(data));
    }
}
