import { ILangGraphClient } from "../types.js";

export const createLangGraphServerClient = async (): Promise<ILangGraphClient> => {
    const { Client } = await import("@langchain/langgraph-sdk");
    return new Client() as unknown as ILangGraphClient;
};
