import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "@langgraph-js/sdk",
    description: "@langgraph-js/sdk 使用文档",
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "🏠 首页", link: "/" },
            { text: "📦 LangGraph Server", link: "/langgraph-js/api/index" },
            { text: "📦 @langgraph-js/sdk", link: "/langgraph-js/sdk/index" },
        ],

        sidebar: [
            {
                text: "🏢 LangGraph Server",
                items: [
                    { text: "🌐 概述", link: "/langgraph-js/api/index" },
                    { text: "💽 PostgreSQL 配置", link: "/langgraph-js/api/postgres-setup" },
                    { text: "🔍 监控系统", link: "/langgraph-js/api/monitoring" },
                    { text: "📦 @langgraph-js/sdk", link: "/langgraph-js/sdk/index" },
                    { text: "📟 @langgraph-js/api", link: "/langgraph-js/api/api" },
                    { text: "🔨 @langgraph-js/bundler", link: "/langgraph-js/api/bundler" },
                    { text: "🖥️ @langgraph-js/ui", link: "/langgraph-js/api/ui" },
                ],
            },
            {
                text: "🚀 部署指南",
                items: [
                    { text: "📋 基本部署说明", link: "/langgraph-js/api/deployment/index" },

                    { text: "📦 Node.js 部署", link: "/langgraph-js/api/deployment/node" },
                    { text: "🦕 Deno 部署", link: "/langgraph-js/api/deployment/deno" },
                    { text: "⚡ Bun 部署", link: "/langgraph-js/api/deployment/bun" },
                ],
            },
            {
                text: "🛒 @langgraph-js/sdk",
                items: [
                    { text: "🚀 快速开始", link: "/langgraph-js/sdk/index" },
                    { text: "⚙️ 速查表", link: "/langgraph-js/sdk/quickstart" },
                    {
                        text: "🎨 生成式 UI",
                        items: [
                            { text: "🖌️ 自定义 UI 渲染", link: "/langgraph-js/sdk/generative-ui/custom-ui-rendering" },
                            { text: "🖼️ 多模态", link: "/langgraph-js/sdk/generative-ui/multimodal" },
                            { text: "⏹️ 停止消息生成", link: "/langgraph-js/sdk/generative-ui/stop-message-generation" },
                            { text: "🔢 token 计数器", link: "/langgraph-js/sdk/generative-ui/token-counter" },
                            { text: "❌ 异常信息显示", link: "/langgraph-js/sdk/generative-ui/error-handling" },
                            { text: "⏳ 耗时显示", link: "/langgraph-js/sdk/generative-ui/spend-time" },
                            { text: "🔄 Tool 聚合(TODO)", link: "/langgraph-js/sdk/generative-ui/duplicate-tool-aggregation" },
                            { text: "📝 推理内容显示(TODO)", link: "/langgraph-js/sdk/generative-ui/custom-reasoning-content" },
                        ],
                    },
                    {
                        text: "🖥️ 人工干预（HITL）",
                        items: [
                            { text: "🛠️ 前端工具 - FFT", link: "/langgraph-js/sdk/frontend-actions/frontend-function-as-tool" },
                            { text: "🔗 后端声明", link: "/langgraph-js/sdk/frontend-actions/backend-declare" },
                            { text: "⚠️ interrupt 处理（TODO）", link: "/langgraph-js/sdk/frontend-actions/interrupt-handling" },
                        ],
                    },
                    {
                        text: "🔑 LangGraph 鉴权",
                        items: [
                            { text: "🍪 基于 Cookie 的身份验证", link: "/langgraph-js/sdk/authorization/cookie-authentication" },
                            { text: "🛡️ 自定义令牌身份验证", link: "/langgraph-js/sdk/authorization/custom-token-authentication" },
                            { text: "🔒 OAuth2 支持（TODO）", link: "/langgraph-js/sdk/authorization/oauth2-support" },
                        ],
                    },
                    {
                        text: "💾 持久化",
                        items: [{ text: "📜 从 LangGraph 读取历史记录", link: "/langgraph-js/sdk/persistence/read-history" }],
                    },
                    {
                        text: "🧩 核心数据生成",
                        items: [
                            { text: "🗨️ 聊天标题（TODO）", link: "/langgraph-js/sdk/sub-generation/chat-title-auto-generation" },
                            { text: "💡 对话建议（TODO）", link: "/langgraph-js/sdk/sub-generation/suggestions" },
                        ],
                    },
                ],
            },
        ],
        socialLinks: [{ icon: "github", link: "https://github.com/KonghaYao/YaoAgent/tree/main/apps/langgraph-client" }],
        search: {
            provider: "local",
        },
    },
});
