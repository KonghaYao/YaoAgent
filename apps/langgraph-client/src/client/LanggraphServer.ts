import { LangGraphClientConfig } from "../LangGraphClient.js";
import { type ILangGraphClient } from "@langgraph-js/pure-graph/dist/types.js";

export const createLangGraphServerClient = async (config: LangGraphClientConfig): Promise<ILangGraphClient> => {
    const { Client } = await import("@langchain/langgraph-sdk");
    return new Client(config) as ILangGraphClient;
};
