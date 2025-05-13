import React, { useState } from "react";
import JsonToMessage from "./JsonToMessage";

interface JsonToMessageButtonProps {
    buttonText?: string;
    initialJson?: string | object;
    className?: string;
}

const JsonToMessageButton: React.FC<JsonToMessageButtonProps> = ({ buttonText = "JSON 预览", initialJson, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    return (
        <>
            <button className={`history-button ${className}`} onClick={openModal}>
                {buttonText}
            </button>

            <JsonToMessage isOpen={isOpen} onClose={closeModal} initialJson={initialJson} />
        </>
    );
};

export default JsonToMessageButton;
