import { expect, test } from "vitest";
import { TestLangGraphChat, createChatStore, createLowerJSClient } from "../src";

test("test", async () => {
    const client = await createLowerJSClient({
        apiUrl: "http://localhost:8123",
        defaultHeaders: {
            Authorization: "Bearer 123",
        },
    });
    const testChat = new TestLangGraphChat(
        createChatStore(
            "graph",
            {
                defaultHeaders: {
                    Authorization: "Bearer 123",
                },
                client,
                legacyMode: true,
            },
            {}
        ),
        { debug: true }
    );
    await testChat.ready();

    await testChat.humanInput("你好", async () => {
        const aiMessage = await testChat.waitFor("ai");
        expect(aiMessage.content).toBeDefined();
    });
    expect(1).toBe(1);
});
