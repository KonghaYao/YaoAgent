import { RenderMessage } from "@langgraph-js/sdk";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface DebugPanelContextType {
    isDebugPanelVisible: boolean;
    setIsDebugPanelVisible: (visible: boolean) => void;
    toggleDebugPanel: () => void;
    messagesContext: string;
    setMessagesContext: (messages: RenderMessage[]) => void;
}

const DebugPanelContext = createContext<DebugPanelContextType | undefined>(undefined);

export const useDebugPanel = () => {
    const context = useContext(DebugPanelContext);
    if (context === undefined) {
        throw new Error("useDebugPanel must be used within a DebugPanelProvider");
    }
    return context;
};

interface DebugPanelProviderProps {
    children: ReactNode;
}

export const DebugPanelProvider: React.FC<DebugPanelProviderProps> = ({ children }) => {
    const [messagesContext, setMessagesContext] = useState<string>("");
    const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(false);

    const toggleDebugPanel = () => {
        setIsDebugPanelVisible((prev) => !prev);
    };

    const value = {
        isDebugPanelVisible,
        setIsDebugPanelVisible,
        toggleDebugPanel,
        messagesContext,
        setMessagesContext(messages: RenderMessage[]) {
            setMessagesContext(JSON.stringify(messages));
        },
    };

    return <DebugPanelContext.Provider value={value}>{children}</DebugPanelContext.Provider>;
};
