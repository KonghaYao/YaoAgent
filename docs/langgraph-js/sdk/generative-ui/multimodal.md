# 多模态数据输入

多模态数据的解析依赖于大模型本身的能力，比如图片识别和语音输入，sendMessage 这个函数支持传递多个 content，每个 content 都是 标准的 OpenAI 格式的数据。

## 使用示例

```typescript
const { sendMessage } = useChat();
// 发送包含文本和图片的消息
const sendMultiModalMessage = () => {
    const content = [
        {
            type: "human",
            content: [
                {
                    type: "text",
                    text: "用户输入的文本",
                },
                ...imageUrls.map((url) => ({
                    type: "image_url",
                    image_url: { url },
                })),
            ],
        },
    ];

    sendMessage(content);
};
```
