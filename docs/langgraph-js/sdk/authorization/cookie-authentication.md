# 🍪 基于 Cookie 的身份验证

在 @langgraph-js/sdk 中，基于 Cookie 的身份验证提供了一种简单且安全的方式来管理用户会话。这种方法特别适合与现有的 Web 应用程序集成，因为它利用了浏览器原生的 Cookie 机制来维护用户状态。通过这种方式，您可以实现无缝的用户体验，同时确保应用程序的安全性。

auth 权限的配置完全兼容 LangGraph 的实现，这意味着您可以轻松地将现有的身份验证系统与 LangGraph 集成。

## 配置客户端

要启用基于 Cookie 的身份验证，您需要在创建 LangGraph 客户端时配置 `callerOptions` 参数。这个配置确保了所有请求都会自动携带必要的 Cookie 信息：

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

在这个配置中：

- `apiUrl` 指定了后端服务的地址
- `callerOptions` 配置了请求的行为
- `credentials: "include"` 确保请求会携带 Cookie
- 自定义的 `fetch` 函数处理所有请求的 Cookie 传递

## 身份验证流程

基于 Cookie 的身份验证遵循以下流程：

1. **用户登录**
   - 用户在应用程序中完成登录
   - 服务器验证用户凭据
   - 生成会话标识符

2. **Cookie 设置**
   - 服务器创建包含会话信息的 Cookie
   - 设置适当的 Cookie 属性（如过期时间、安全标志等）
   - 将 Cookie 发送给客户端

3. **请求处理**
   - LangGraph UI 客户端自动在请求中包含 Cookie
   - 每个请求都会携带会话信息
   - 无需手动管理身份验证状态

4. **会话验证**
   - 后端验证 Cookie 的有效性
   - 检查会话是否过期
   - 验证用户权限

## 后端配置

在 LangGraph 后端，您需要配置身份验证处理程序来验证 Cookie。这个处理程序负责：

1. **Cookie 提取和验证**
   - 从请求头中获取 Cookie
   - 解析 Cookie 字符串
   - 验证会话 ID 的有效性

2. **用户身份管理**
   - 验证用户会话
   - 提取用户身份信息
   - 设置用户权限

3. **错误处理**
   - 处理 Cookie 缺失情况
   - 处理无效会话
   - 提供清晰的错误信息

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
