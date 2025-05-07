# 🍪 基于 Cookie 的身份验证

在 @langgraph-js/sdk  中，您可以使用基于 Cookie 的身份验证来保护您的应用程序。此方法允许用户在登录后通过 Cookie 来保持会话状态，特别适合与现有的 Web 应用程序集成。

## 配置客户端

要启用基于 Cookie 的身份验证，您需要在创建 LangGraph 客户端时配置 `callerOptions` 参数：

```tsx
import { createChatStore } from "@langgraph-js/sdk";

export const globalChatStore = createChatStore(
    "agent",
    {
        apiUrl: "http://localhost:8123",
        callerOptions: {
            // 携带 cookie 的配置
            fetch(url: string, options: RequestInit) {
                // 确保请求包含凭据（cookies）
                options.credentials = "include";
                return fetch(url, options);
            },
        },
    },
    {
        onInit(client) {
            // 初始化客户端，绑定工具等
            client.tools.bindTools([]);
        },
    }
);
```

## 身份验证流程

1. 用户在您的应用程序中登录
2. 服务器设置身份验证 Cookie
3. LangGraph UI 客户端在每个请求中自动发送这些 Cookie
4. LangGraph 后端验证 Cookie 并允许或拒绝访问

## 后端配置

在 LangGraph 后端，您需要配置身份验证处理程序来验证 Cookie：

```typescript
import { Auth, HTTPException } from "@langchain/langgraph-sdk/auth";

export const auth = new Auth()
    .authenticate(async (request: Request) => {
        // 从请求中获取 cookies
        const cookies = request.headers.get("cookie");
        
        if (!cookies) {
            throw new HTTPException(401, { message: "未提供身份验证 Cookie" });
        }
        
        try {
            // 解析和验证 cookies
            // 例如，从 cookie 字符串中提取会话 ID
            const sessionId = parseCookies(cookies)["session_id"];
            
            if (!sessionId) {
                throw new HTTPException(401, { message: "无效的会话 ID" });
            }
            
            // 验证会话 ID（实际实现取决于您的身份验证系统）
            const userId = await validateSession(sessionId);
            
            // 返回用户身份和权限
            return { 
                identity: userId, 
                permissions: [],
                // 可以将原始 cookies 传递给后续处理
                cookies 
            };
        } catch (error) {
            throw new HTTPException(401, { message: "Cookie 验证失败", cause: error });
        }
    })
    // 定义基于身份的访问控制
    .on("*", ({ value, user }) => {
        // 为资源添加所有者
        if ("metadata" in value) {
            value.metadata ??= {};
            value.metadata.owner = user.identity;
        }
        // 只返回用户拥有的资源
        return { owner: user.identity };
    });
```
