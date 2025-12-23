import { ArtifactCommand, createUITool } from "@langgraph-js/sdk";
import { FileIcon, Code2, Eye, Sparkles, Terminal } from "lucide-react";
import { useChat } from "@langgraph-js/sdk/react";
import { motion } from "motion/react";

export const create_artifacts = createUITool({
    name: "create_artifacts",
    description: "创建并保存代码文件到 artifacts 目录",
    parameters: {},
    onlyRender: true,
    render(tool: any) {
        const data: Partial<ArtifactCommand> = tool.getInputRepaired();
        const { setCurrentArtifactById, setShowArtifact } = useChat();

        const toggleExpand = () => {
            if (!data.id) return;
            setCurrentArtifactById(data.id, tool.message.id!);
            setShowArtifact(true);
        };

        // 根据文件扩展名获取合适的图标
        const getFileIcon = (filename: string = "") => {
            const ext = filename.split(".").pop()?.toLowerCase();
            switch (ext) {
                case "tsx":
                case "jsx":
                case "ts":
                case "js":
                    return <Code2 className="w-5 h-5 text-blue-500" />;
                case "py":
                    return <Terminal className="w-5 h-5 text-green-500" />;
                case "html":
                case "css":
                    return <Code2 className="w-5 h-5 text-orange-500" />;
                default:
                    return <FileIcon className="w-5 h-5 text-gray-500" />;
            }
        };

        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-2 max-w-md">
                {/* Artifact 卡片 */}
                <div
                    className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-700/50"
                    onClick={toggleExpand}
                >
                    {/* 背景光晕效果 */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-colors duration-500" />

                    <div className="p-4 relative flex items-center gap-4">
                        {/* 图标容器 */}
                        <div className="relative shrink-0">
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm group-hover:shadow-md transition-all duration-300">
                                {getFileIcon(data.title)}
                            </div>
                            <div className="absolute -top-1 -right-1 p-1 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50">
                                <Sparkles className="w-2 h-2 text-white" />
                            </div>
                        </div>

                        {/* 文字内容 */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                            <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{data.title}</h5>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-block max-w-[150px] truncate text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-500/20 whitespace-nowrap">
                                    ID: {data.id}
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    可交互
                                </span>
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="shrink-0">
                            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
                                <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </div>
                        </div>
                    </div>

                    {/* 悬停时的底部进度条式装饰 */}
                    <div className="h-0.5 w-full bg-transparent overflow-hidden">
                        <motion.div initial={{ x: "-100%" }} whileHover={{ x: "0%" }} className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" transition={{ duration: 0.4 }} />
                    </div>
                </div>
            </motion.div>
        );
    },
});
