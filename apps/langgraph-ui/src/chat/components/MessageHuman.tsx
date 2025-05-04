import React from "react";

interface MessageHumanProps {
    content: any;
}

const MessageHuman: React.FC<MessageHumanProps> = ({ content }) => {
    return (
        <div className="message human">
            <div className="message-content">{typeof content === "string" ? content : JSON.stringify(content)}</div>
        </div>
    );
};

export default MessageHuman;
