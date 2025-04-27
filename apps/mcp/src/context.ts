import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";

export const context: Record<string, any> = {};

export const useContext = (extra: RequestHandlerExtra<any, any>) => {
    if (!extra.sessionId) {
        console.log("SessionId is null");
        return {};
    }

    const contextData = context[extra.sessionId] || {};

    // Transform x-a headers
    for (const [key, value] of Object.entries(contextData)) {
        if (key.toLowerCase().startsWith("x-")) {
            contextData[key.replace("x-", "").toUpperCase()] = value;
        }
    }
    return contextData;
};
