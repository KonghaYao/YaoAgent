import { RenderMessage } from "@langgraph-js/sdk";
import { useChat } from "@langgraph-js/sdk/react";
import React from "react";
import { RotateCcw, Undo } from "lucide-react";

interface MessageHumanProps {
    message: RenderMessage;
    content: string | any[];
}

// 解析文本内容中的文件标签，只有完全匹配时才返回解析结果
const parseFileTags = (text: string): any[] => {
    // 检查文本是否完全由文件标签组成（去除空白字符后）
    const trimmedText = text.trim();

    // 如果文本完全匹配单个文件标签格式
    const singleMatch = trimmedText.match(/^<file type="([^"]+)" url="([^"]+)"><\/file>$/);
    if (singleMatch) {
        const [, fileType, url] = singleMatch;
        if (fileType === "image") {
            return [
                {
                    type: "image_url",
                    image_url: { url },
                },
            ];
        } else if (fileType === "video") {
            return [
                {
                    type: "video_url",
                    video_url: { url },
                },
            ];
        } else if (fileType === "audio") {
            return [
                {
                    type: "audio_url",
                    audio_url: { url },
                },
            ];
        } else if (fileType === "other") {
            return [
                {
                    type: "file_url",
                    file_url: { url },
                },
            ];
        }
    }

    // 如果不完全匹配，返回空数组
    return [];
};

const MessageHuman: React.FC<MessageHumanProps> = ({ message, content }) => {
    const chat = useChat();
    const renderContent = () => {
        if (typeof content === "string") {
            return <div className="text-white whitespace-pre-wrap">{content}</div>;
        }

        if (Array.isArray(content)) {
            return content
                .flatMap((item) => {
                    if (item.type === "text" && typeof item.text === "string") {
                        // 检查文本是否包含文件标签
                        const parsedParts = parseFileTags(item.text);
                        if (parsedParts.length > 0) {
                            return parsedParts;
                        } else {
                            return [item];
                        }
                    } else {
                        return [item];
                    }
                })
                .map((item, index) => {
                    switch (item.type) {
                        case "text":
                            return (
                                <div key={index} className="text-white whitespace-pre-wrap">
                                    {item.text}
                                </div>
                            );
                        case "image_url":
                            return (
                                <div key={index} className="mt-2">
                                    <img src={item.image_url.url} alt={item.image_url.url} className="max-w-[200px] rounded" />
                                </div>
                            );
                        case "video_url":
                            return (
                                <div key={index} className="mt-2">
                                    <video controls src={item.video_url.url} className="max-w-[200px] rounded">
                                        您的浏览器不支持视频播放
                                    </video>
                                </div>
                            );
                        case "audio_url":
                            return (
                                <div key={index} className="mt-2">
                                    <audio controls src={item.audio_url.url} className="w-full">
                                        您的浏览器不支持音频播放
                                    </audio>
                                </div>
                            );
                        case "file_url":
                            return (
                                <div key={index} className="mt-2 p-2 bg-gray-100 rounded flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-gray-500">
                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                    <a href={item.file_url.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm">
                                        下载文件
                                    </a>
                                </div>
                            );
                        default:
                            return (
                                <div key={index} className="text-white whitespace-pre-wrap">
                                    {JSON.stringify(item)}
                                </div>
                            );
                    }
                });
        }

        return <div className="text-white whitespace-pre-wrap">{JSON.stringify(content)}</div>;
    };

    return (
        <div className="flex flex-row w-full justify-end group/message-human">
            <div className="hidden group-hover/message-human:flex gap-2 mx-2">
                <button onClick={() => chat.revertChatTo(message.id!, true)} className="p-2 text-gray-700 transition-colors cursor-pointer" title="重试">
                    <RotateCcw size={16} />
                </button>
                <button onClick={() => chat.revertChatTo(message.id!, false)} className="p-2 text-gray-700 transition-colors cursor-pointer" title="回退">
                    <Undo size={16} />
                </button>
            </div>
            <div className="flex flex-col w-fit bg-blue-500/90 rounded-2xl text-white px-4 py-3 max-w-[80%]">{renderContent()}</div>
        </div>
    );
};

export default MessageHuman;
