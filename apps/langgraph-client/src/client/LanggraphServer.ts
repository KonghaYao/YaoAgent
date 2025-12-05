import { LangGraphClientConfig } from "../LangGraphClient.js";
import { type ILangGraphClient } from "@langgraph-js/pure-graph/dist/types.js";
import { Client } from "@langchain/langgraph-sdk";
export const createLangGraphServerClient = async (config: LangGraphClientConfig): Promise<ILangGraphClient> => {
    return new Client(config) as ILangGraphClient;
};
