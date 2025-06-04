import { RenderMessage } from "../LangGraphClient.js";

import { LangGraphClient } from "../LangGraphClient.js";
import { getMessageContent } from "../ui-store/createChatStore.js";
import { jsonrepair } from "jsonrepair";
export class ToolRenderData<I, D> {
    constructor(
        public message: RenderMessage,
        public client: LangGraphClient
    ) {}
    get state() {
        if (this.message.type === "tool" && this.message?.additional_kwargs?.done) {
            return "done";
        }
        if (this.message.tool_input) {
            return "loading";
        }
        return "idle";
    }
    get input(): I | null {
        try {
            return JSON.parse(this.message.tool_input!);
        } catch (e) {
            return null;
        }
    }
    get output() {
        return getMessageContent(this.message.content);
    }
    getJSONOutput(): D {
        return JSON.parse(this.output);
    }
    /** 如果解析失败，则返回 null */
    getJSONOutputSafe(): D | null {
        try {
            return JSON.parse(this.output);
        } catch (e) {
            return null;
        }
    }
    getInputRepaired(): I | null {
        try {
            return JSON.parse(jsonrepair(this.message.tool_input || ""));
        } catch (e) {
            return null;
        }
    }
    response(data: D) {
        this.client.doneFEToolWaiting(this.message.id!, JSON.stringify(data));
    }
}
