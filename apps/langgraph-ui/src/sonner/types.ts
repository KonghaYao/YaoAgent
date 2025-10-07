export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export interface ToastOptions {
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}
