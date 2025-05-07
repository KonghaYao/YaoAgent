import { createChatStore } from "@langgraph-js/sdk";
export const globalChatStore = createChatStore(
    "agent",
    {
        apiUrl: "http://localhost:8123",
        defaultHeaders: JSON.parse(localStorage.getItem("code") || "{}"),
        callerOptions: {
            // 携带 cookie 的写法
            // fetch(url: string, options: RequestInit) {
            //     options.credentials = "include";
            //     return fetch(url, options);
            // },
        },
    },
    {
        onInit(client) {
            client.tools.bindTools([]);
        },
    }
);
