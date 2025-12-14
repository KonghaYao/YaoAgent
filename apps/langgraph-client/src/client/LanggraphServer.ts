import { LangGraphClientConfig } from "../LangGraphClient.js";
import { type ILangGraphClient } from "@langgraph-js/pure-graph/dist/types.js";
import { Client } from "@langchain/langgraph-sdk";
export const createLangGraphServerClient = async (config: LangGraphClientConfig): Promise<ILangGraphClient> => {
    const client = new Client(config) as ILangGraphClient;
    client.threads.search = function (this: any, query: any) {
        return this.fetch("/threads/search", {
            method: "POST",
            json: {
                metadata: (query == null ? void 0 : query.metadata) ?? void 0,
                ids: (query == null ? void 0 : query.ids) ?? void 0,
                limit: (query == null ? void 0 : query.limit) ?? 10,
                offset: (query == null ? void 0 : query.offset) ?? 0,
                status: query == null ? void 0 : query.status,
                sort_by: query == null ? void 0 : query.sortBy,
                sort_order: query == null ? void 0 : query.sortOrder,
                select: (query == null ? void 0 : query.select) ?? void 0,
                without_details: (query == null ? void 0 : query.without_details) ?? false,
            },
        });
    }.bind(client.threads);
    return client;
};
