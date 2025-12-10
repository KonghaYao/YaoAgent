export type HumanInTheLoopDecision = {
    type: "approve" | "edit" | "reject" | "respond";
    edited_action?: {
        name: string;
        args: Record<string, any>;
    };
    message?: string;
};

/**
 * HumanInTheLoop 的标准回复格式
 */
export type InterruptResponse = {
    decisions: HumanInTheLoopDecision[];
};
/** 由于 langchain human in the loop 没有设计调用 id，所以我们需要给一个 id */
export const createActionRequestID = (j: { name: string; args: any }) => {
    return j.name + JSON.stringify(j.args);
};

export type HumanInTheLoopState = {
    interruptData: InterruptData;
    result: Record<string, HumanInTheLoopDecision>;
};

export type InterruptData = {
    id: string;
    value: {
        actionRequests: {
            id?: string;
            name: string;
            description: string;
            args: any;
        }[];
        reviewConfigs: {
            actionName: string;
            allowedDecisions: ("approve" | "edit" | "reject" | "respond")[];
        }[];
    };
}[];
