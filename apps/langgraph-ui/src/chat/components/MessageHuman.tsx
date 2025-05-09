import React from "react";
interface MessageHumanProps {
    content: string | any[];
}

const MessageHuman: React.FC<MessageHumanProps> = ({ content }) => {
    const renderContent = () => {
        if (typeof content === "string") {
            return <div className="message-text">{content}</div>;
        }

        if (Array.isArray(content)) {
            return content.map((item, index) => {
                switch (item.type) {
                    case "text":
                        return (
                            <div key={index} className="message-text">
                                {item.text}
                            </div>
                        );
                    case "image_url":
                        return (
                            <div key={index} className="message-image">
                                <img src={item.image_url.url} alt="用户上传的图片" style={{ maxWidth: "200px", borderRadius: "4px" }} />
                            </div>
                        );
                    case "audio":
                        return (
                            <div key={index} className="message-audio">
                                <audio controls src={item.audio_url}>
                                    您的浏览器不支持音频播放
                                </audio>
                            </div>
                        );
                    default:
                        return (
                            <div key={index} className="message-text">
                                {JSON.stringify(item)}
                            </div>
                        );
                }
            });
        }

        return <div className="message-text">{JSON.stringify(content)}</div>;
    };

    return (
        <div className="message human">
            <div className="message-content">{renderContent()}</div>
        </div>
    );
};

export default MessageHuman;
