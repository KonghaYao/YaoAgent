import { createChatStore } from "@langgraph-js/sdk";
const F =
    localStorage.getItem("withCredentials") === "true"
        ? (url: string, options: RequestInit) => {
              options.credentials = "include";
              return fetch(url, options);
          }
        : fetch;
export const globalChatStore = createChatStore(
    "agent",
    {
        apiUrl: localStorage.getItem("apiUrl") || "http://localhost:8123",
        defaultHeaders: JSON.parse(localStorage.getItem("code") || "{}"),
        callerOptions: {
            // 携带 cookie 的写法
            fetch: F,
        },
    },
    {
        onInit(client) {
            client.tools.bindTools([]);
        },
    }
);
