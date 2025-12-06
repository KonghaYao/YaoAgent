import { RenderMessage } from "../LangGraphClient.js";

import { LangGraphClient } from "../LangGraphClient.js";
import { getMessageContent } from "../ui-store/createChatStore.js";
import { jsonrepair } from "jsonrepair";
import { InterruptResponse } from "./createTool.js";

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export class ToolRenderData<I, D> {
    constructor(
        public message: RenderMessage,
        public client: LangGraphClient
    ) {}
    /**
     * 获取人机交互数据
     * 直接使用 reviewConfig 获取可以显示的按钮
     * actionRequest 获取当前工具的入参
     */
    getHumanInTheLoopData() {
        const configOfHumanInTheLoop = this.client.humanInTheLoop?.find((i) => i.value.reviewConfigs?.some((j) => j.actionName === this.message.name));
        if (!configOfHumanInTheLoop) return null;
        return {
            config: configOfHumanInTheLoop,
            reviewConfig: configOfHumanInTheLoop.value.reviewConfigs.find((j) => j.actionName === this.message.name)!,
            actionRequest: configOfHumanInTheLoop.value.actionRequests.find((j) => j.name === this.message.name)!,
        };
    }
    /** 发送恢复状态的数据 */
    sendResumeData(response: InterruptResponse["decisions"][number]) {
        if (response.type === "edit") {
            /**@ts-ignore 修复 sb 的 langchain 官方的命名不统一，我们一致采用下划线版本，而非驼峰版本 */
            response.editedAction = response.edited_action;
        }
        return this.client.doneFEToolWaiting(this.message.id!, { decisions: [response] });
    }
    get state() {
        if (this.message.type === "tool" && this.message?.additional_kwargs?.done) {
            return "done";
        }
        if (this.client.status === "interrupted" && this.client.humanInTheLoop?.some((i) => i.value.reviewConfigs?.some((j) => j.actionName === this.message.name))) {
            return "interrupted";
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
    getInputRepaired(): DeepPartial<I> {
        try {
            return JSON.parse(jsonrepair(this.message.tool_input || ""));
        } catch (e) {
            return {};
        }
    }
    response(data: D) {
        this.client.doneFEToolWaiting(this.message.id!, JSON.stringify(data));
    }
}
