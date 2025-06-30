import { expect, test } from "vitest";
import { TestLangGraphChat, createChatStore } from "../src";

test("test", async () => {
    const testChat = new TestLangGraphChat(
        createChatStore(
            "agent",
            {
                defaultHeaders: {
                    Authorization: "Bearer 123",
                },
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
