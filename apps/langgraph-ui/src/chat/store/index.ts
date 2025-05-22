import { createChatStore } from "@langgraph-js/sdk";
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
import { askUserTool } from "../tools";
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
            client.tools.bindTools([askUserTool]);
        },
    }
);
