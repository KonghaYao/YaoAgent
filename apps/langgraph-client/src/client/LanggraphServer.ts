import { LangGraphClientConfig } from "../LangGraphClient.js";
import { ILangGraphClient } from "../types.js";

export const createLangGraphServerClient = async (config: LangGraphClientConfig): Promise<ILangGraphClient> => {
    const { Client } = await import("@langchain/langgraph-sdk");
    return new Client(config) as unknown as ILangGraphClient;
};
