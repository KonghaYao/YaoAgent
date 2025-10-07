import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
type ChatContextType = UnionStore<typeof globalChatStore>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};

interface ChatProviderProps {
    children: ReactNode;
}
import { globalChatStore } from "../store";
import { UnionStore, useUnionStore } from "@langgraph-js/sdk";
import { useStore } from "@nanostores/react";
import { toast } from "../../sonner/toast";
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const store = useUnionStore(globalChatStore, useStore);
    useEffect(() => {
        store
            .initClient()
            .then((res) => {
                if (store.showHistory) {
                    store.refreshHistoryList();
                }
                // console.log(res);
                toast.success("Hello, LangGraph!");
            })
            .catch((err) => {
                console.error(err);
                toast.error("请检查服务器配置: ", "初始化客户端失败，" + store.currentAgent + "\n" + err, {
                    duration: 10000,
                    action: {
                        label: "去设置",
                        onClick: () => {
                            document.getElementById("setting-button")?.click();
                            setTimeout(() => {
                                document.getElementById("server-login-button")?.click();
                            }, 300);
                        },
                    },
                });
                // const agentName = prompt("Failed to initialize chat client: " + store.currentAgent + "\n请输入 agent 名称");
                // localStorage.setItem("agent_name", agentName!);
                // location.reload();
            });
    }, []);

    return <ChatContext.Provider value={store}>{children}</ChatContext.Provider>;
};
