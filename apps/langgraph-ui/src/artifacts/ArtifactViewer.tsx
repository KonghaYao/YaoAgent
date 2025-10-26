"use client";
import { useEffect } from "react";
import { setArtifactStore, artifactStore, ArtifactType } from "ai-artifacts";
import { useChat } from "@langgraph-js/sdk/react";

export const ArtifactViewer: React.FC = () => {
    const { artifacts, currentArtifactId } = useChat();
    useEffect(() => {
        setArtifactStore({
            artifacts: { default: artifacts as ArtifactType[] },
        });
    }, [artifacts]);
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
