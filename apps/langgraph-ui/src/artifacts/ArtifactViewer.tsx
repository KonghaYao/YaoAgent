"use client";
import { useEffect, useRef } from "react";
import { setArtifactStore, eventCenter, ArtifactType } from "ai-artifacts";
import { useChat } from "@langgraph-js/sdk/react";

export interface ArtifactViewerProps {
    onSendBackToAI: (data: { storeId: string; groupId: string; versionId: string; file: string; error: string }) => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ onSendBackToAI }) => {
    const { artifacts, currentArtifactId } = useChat();
    const artifactsRef = useRef(artifacts);

    useEffect(() => {
        artifactsRef.current = artifacts;
    }, [artifacts]);

    useEffect(() => {
        setArtifactStore({
            artifacts: { default: artifacts as ArtifactType[] },
        });
    }, [artifacts]);

    useEffect(() => {
        const handleSendBackToAI = (data: any) => {
            onSendBackToAI(data);
        };
        eventCenter.on("sendBackToAI", handleSendBackToAI);
        return () => {
            eventCenter.off("sendBackToAI", handleSendBackToAI);
        };
    }, []);
    return <ai-artifacts store-id="default" group-id={currentArtifactId?.[0] || ""} version-id={currentArtifactId?.[1] || ""}></ai-artifacts>;
};

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "ai-artifacts": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                "store-id"?: string;
                "group-id"?: string;
                "version-id"?: string;
            };
        }
    }
}
export {};
