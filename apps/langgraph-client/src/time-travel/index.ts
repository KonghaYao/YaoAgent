import { Client, Message } from "@langchain/langgraph-sdk";

export async function revertChatTo(client: Client<{ messages: Message[] }, { messages: Message[] }, unknown>, threadId: string, messageId: string) {
    const thread = await client.threads.get(threadId);
    const messages = thread.values.messages;
    const idx = messages.findIndex((message) => message.id === messageId);
    if (idx === -1) {
        throw new Error(`Message id ${messageId} not found`);
    }
    const removeMessages = messages.slice(idx + 1);
    const state = {
        ...thread.values,
        messages: removeMessages.map((i) => {
            // sb langgraph 官方实现都不能正常工作
            // return new RemoveMessage({ id: i.id! }).toJSON();
            return {
                type: "remove",
                id: i.id!,
            };
        }),
    };
    const res = await client.threads.updateState(threadId, {
        values: state,
    });
    // client.runs.wait();
    return {
        state: {
            messages: messages.slice(0, idx + 1),
        },
        checkpoint: res,
    };
}
