import { createChatStore } from "@langgraph-js/sdk";

export const globalChatStore = createChatStore("agent", {
    apiUrl: "http://localhost:8123",
});
