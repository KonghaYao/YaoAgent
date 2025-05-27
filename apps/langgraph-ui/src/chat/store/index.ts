import { createChatStore } from "@langgraph-js/sdk";
import { ask_user_for_approve } from "../tools/index";
import { FullTextSearchService, OpenAIVectorizer, VecDB, createMemoryTool } from "../../memory/index";

const F =
    localStorage.getItem("withCredentials") === "true"
        ? (url: string, options: RequestInit) => {
              options.credentials = "include";
              return fetch(url, options);
          }
        : fetch;

const getLocalConfig = () => {
    return {
        showHistory: localStorage.getItem("showHistory") === "true" || false,
        showGraph: localStorage.getItem("showGraph") === "true" || false,
    };
};
export const setLocalConfig = (config: Partial<{ showHistory: boolean; showGraph: boolean }>) => {
    Object.entries(config).forEach(([key, value]) => {
        localStorage.setItem(key, value.toString());
    });
};

// const vectorizer = new OpenAIVectorizer("text-embedding-3-small", {
//     apiKey: import.meta.env.VITE_MEMORY_API_KEY,
//     apiEndpoint: import.meta.env.VITE_MEMORY_API_ENDPOINT,
// });
// const db = new VecDB({
//     vectorizer,
//     dbName: "memory_db",
//     dbVersion: 1,
//     storeName: "memory",
// });
const db = new FullTextSearchService({
    dbName: "memory_fulltext_db",
    dbVersion: 1,
    storeName: "memory",
});
db.initialize();
export const memoryTool = createMemoryTool(db);

export const globalChatStore = createChatStore(
    localStorage.getItem("agent_name") || "",
    {
        apiUrl: localStorage.getItem("apiUrl") || "http://localhost:8123",
        defaultHeaders: JSON.parse(localStorage.getItem("code") || "{}"),
        callerOptions: {
            // 携带 cookie 的写法
            fetch: F,
        },
    },
    {
        ...getLocalConfig(),
        onInit(client) {
            client.tools.bindTools([ask_user_for_approve, memoryTool.manageMemory, memoryTool.searchMemory]);
        },
    }
);
