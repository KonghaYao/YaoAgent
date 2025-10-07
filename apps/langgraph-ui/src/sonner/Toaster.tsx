import React from "react";
import { useStore } from "@nanostores/react";
import { toasts, removeToast } from "./toast";
import { Toast } from "./types";

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }: { toast: Toast }) => {
    const getToastStyles = (type: Toast["type"]) => {
        const baseStyles = "flex items-start gap-3 p-4 rounded-2xl shadow-sm backdrop-blur-md border transition-all duration-300 max-w-sm";

        switch (type) {
            case "success":
                return `${baseStyles} bg-white/90 dark:bg-gray-800/90 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-800/50`;
            case "error":
                return `${baseStyles} bg-white/90 dark:bg-gray-800/90 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-800/50`;
            case "warning":
                return `${baseStyles} bg-white/90 dark:bg-gray-800/90 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/50`;
            case "info":
            default:
                return `${baseStyles} bg-white/90 dark:bg-gray-800/90 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50`;
        }
    };

    const getIcon = (type: Toast["type"]) => {
        const iconClasses = "w-5 h-5 flex-shrink-0 mt-0.5 opacity-80";

        switch (type) {
            case "success":
                return (
                    <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                );
            case "error":
                return (
                    <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                );
            case "warning":
                return (
                    <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                );
            case "info":
            default:
                return (
                    <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                        />
                    </svg>
                );
        }
    };

    return (
        <div className={getToastStyles(toast.type)}>
            <div className="flex-shrink-0">{getIcon(toast.type)}</div>

            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{toast.title}</div>
                {toast.description && <div className="text-sm opacity-90 mt-1">{toast.description}</div>}
                {toast.action && (
                    <button
                        onClick={toast.action.onClick}
                        className="text-sm font-medium text-current/80 hover:text-current mt-2 px-2 py-1 rounded-md hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-current/50"
                    >
                        {toast.action.label}
                    </button>
                )}
            </div>

            <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 ml-2 p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-current/50"
                aria-label="关闭通知"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export const Toaster: React.FC = () => {
    const currentToasts = useStore(toasts);

    if (currentToasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
            {currentToasts.map((toast: Toast) => (
                <div key={toast.id} className="pointer-events-auto animate-in slide-in-from-right-2 fade-in duration-200">
                    <ToastItem toast={toast} />
                </div>
            ))}
        </div>
    );
};
