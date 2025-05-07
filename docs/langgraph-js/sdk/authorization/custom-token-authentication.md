# 🛡️ 自定义令牌身份验证

在 @langgraph-js/sdk  中，自定义令牌身份验证是一种灵活且安全的方式来保护您的应用程序。这种方法允许您实现各种类型的令牌验证机制，如 JWT、API 密钥或自定义令牌格式。

## 配置客户端

要实现自定义令牌身份验证，首先需要在客户端配置中设置默认请求头：

```tsx
import { createChatStore } from "@langgraph-js/sdk";

export const globalChatStore = createChatStore(
    "agent",
    {
        apiUrl: "http://localhost:8123",
        // 设置默认请求头包含令牌
        defaultHeaders: {
            "authorization": "Bearer YOUR_TOKEN_HERE"
        }
    },
    {
        onInit(client) {
            client.tools.bindTools([]);
        },
    }
);
```

## 后端令牌验证

在 LangGraph 后端，需要配置身份验证处理程序来验证自定义令牌：

```typescript
import { Auth, HTTPException } from "@langchain/langgraph-sdk/auth";

// 验证令牌的函数
const verifyToken = async (token: string): Promise<string> => {
    // 这只是一个示例实现
    // 在实际应用中，您可能需要：
    // 1. 验证 JWT 签名
    // 2. 检查令牌是否过期
    // 3. 验证令牌是否在允许的列表中
    // 4. 等等
    
    // 简单示例：计算令牌的哈希值作为用户ID
    const hashToken = await crypto.subtle.digest(
        "SHA-256", 
        new TextEncoder().encode(token)
    );
    
    return Array.from(new Uint8Array(hashToken))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
};

export const auth = new Auth()
    .authenticate(async (request: Request) => {
        // 从 Authorization 头中获取令牌
        const authorization = request.headers.get("authorization");
        const token = authorization?.split(" ").at(-1);
        
        if (!token) {
            throw new HTTPException(401, { message: "未提供身份验证令牌" });
        }
        
        try {
            // 验证令牌并获取用户ID
            const userId = await verifyToken(token);
            
            // 返回用户身份和权限
            return { 
                identity: userId, 
                permissions: [] 
            };
        } catch (error) {
            throw new HTTPException(401, { message: "令牌验证失败", cause: error });
        }
    })
    // 定义资源访问控制
    .on("*", ({ value, user, event }) => {
        // 为资源添加所有者
        if ("metadata" in value) {
            value.metadata ??= {};
            value.metadata.owner = user.identity;
        }
        
        // 允许用户搜索所有 assistants
        if (event === "assistants:search") {
            return;
        }
        
        // 过滤资源，只返回用户拥有的资源
        return { owner: user.identity };
    });
```
