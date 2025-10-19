import { atom, computed, effect, PreinitializedWritableAtom } from "nanostores";
export * from "./types.js";
import { ArtifactCommand } from "./types.js";
import { ToolRenderData } from "../tool/ToolUI.js";
import { LangGraphClient, RenderMessage } from "../LangGraphClient.js";

export interface ComposedArtifact {
    id: string;
    filename: string;
    filetype: string;
    versions: Artifact[];
}

export interface Artifact {
    group_id: string;
    id: string;
    code: string;
    filename: string;
    filetype: string;
    version: number;
    is_done: boolean;
}

// 创建 artifacts computed store
const extractArtifactsFromMessages = (renderMessages: any[], client: any): ComposedArtifact[] => {
    type MiddleArtifactCommand = ArtifactCommand & {
        tool_id?: string;
        is_done?: boolean;
    };
    const files = new Map<string, MiddleArtifactCommand[]>();
    for (const message of renderMessages) {
        if (message.type === "tool" && message.name === "create_artifacts") {
            const tool = new ToolRenderData<ArtifactCommand, {}>(message, client!);
            const command = tool.getInputRepaired() as MiddleArtifactCommand;
            if (!command.id) continue;
            command.tool_id = tool.message.id!;
            command.is_done = tool.state === "done";
            files.set(command.id, [...(files.get(command.id) || []), command]);
        }
    }
    const composedFiles = new Map<string, Artifact[]>();

    // 遍历每个 ID 的命令序列，生成对应的 artifact 版本
    for (const [id, commands] of files) {
        const artifacts: Artifact[] = [];
        let currentContent = "";
        let currentFilename = "";
        let currentFiletype = "";
        let version = 1;

        // 按命令顺序处理每个操作
        for (const command of commands) {
            switch (command.command) {
                case "create":
                    // 创建新 artifact，直接使用 content
                    currentContent = command.content;
                    currentFilename = command.title || `artifact-${id}`;
                    currentFiletype = command.type || command.language;
                    break;

                case "update":
                    // 更新现有内容，使用 old_str 和 new_str 进行替换
                    if (command.old_str && command.new_str) {
                        currentContent = currentContent.replace(command.old_str, command.new_str);
                    } else if (command.content) {
                        // 如果没有 old_str/new_str，则直接使用 content 覆盖
                        currentContent = command.content;
                    }
                    break;

                case "rewrite":
                    currentContent = command.content;
                    break;
            }

            // 创建当前版本的 artifact
            const artifact: Artifact = {
                group_id: id,
                id: command.tool_id!,
                code: currentContent,
                filename: currentFilename,
                filetype: currentFiletype,
                version: version,
                is_done: command.is_done!,
            };

            artifacts.push(artifact);
            version++;
        }

        composedFiles.set(id, artifacts);
    }

    return [...composedFiles.values()].map((artifacts) => ({
        id: artifacts[0].group_id,
        filename: artifacts[artifacts.length - 1].filename,
        filetype: artifacts[artifacts.length - 1].filetype,
        versions: artifacts,
    }));
};
export const useArtifacts = (renderMessages: PreinitializedWritableAtom<RenderMessage[]>, client: PreinitializedWritableAtom<LangGraphClient<unknown> | null>) => {
    // 创建 artifacts store
    const showArtifact = atom<boolean>(false);
    const currentArtifactId = atom<[string, string] | null>(null);
    const artifacts = atom<ComposedArtifact[]>([]);

    effect([renderMessages, client], () => {
        artifacts.set(extractArtifactsFromMessages(renderMessages.get(), client.get()));
    });
    const debouncedSetCurrentArtifactById = (id: string, tool_id: string) => {
        const current = currentArtifactId.get();
        if (current?.[0] === id && current?.[1] === tool_id) {
            return;
        }
        showArtifact.set(true);
        currentArtifactId.set([id, tool_id]);
    };
    return {
        data: {
            artifacts,
            currentArtifactId,
            showArtifact,
        },
        mutation: {
            setCurrentArtifactById: debouncedSetCurrentArtifactById,
            setShowArtifact: (show: boolean) => showArtifact.set(show),
        },
    };
};
