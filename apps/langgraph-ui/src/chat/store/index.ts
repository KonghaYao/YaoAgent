import { createChatStore } from "@langgraph-js/sdk";
import { FullTextSearchService, createMemoryTool } from "../../memory/index";

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
console.log(db);
export const memoryTool = createMemoryTool(db);
const defaultHeaders = JSON.parse(localStorage.getItem("code") || "[]");

export const globalChatStore = createChatStore(
    localStorage.getItem("defaultAgent") || "",
    {
        apiUrl: localStorage.getItem("apiUrl") || "http://localhost:8123",
        defaultHeaders: Object.fromEntries(defaultHeaders.map((i: { key: string; value: string }) => [i.key, i.value])),
        callerOptions: {
            // 携带 cookie 的写法
            fetch: F,
            maxRetries: 1,
        },
    },
    {
        ...getLocalConfig(),
    }
);
