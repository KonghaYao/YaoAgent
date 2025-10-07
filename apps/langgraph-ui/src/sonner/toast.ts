import { atom } from "nanostores";
import { Toast, ToastType, ToastOptions } from "./types";

let toastCounter = 0;

export const toasts = atom<Toast[]>([]);

const createToast = (type: ToastType, title: string, description?: string, options?: ToastOptions): string => {
    const id = `toast-${++toastCounter}`;

    const toast: Toast = {
        id,
        type,
        title,
        description,
        duration: options?.duration ?? 4000,
        action: options?.action,
    };

    toasts.set([...toasts.get(), toast]);

    // Auto remove after duration
    if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
            removeToast(id);
        }, toast.duration);
    }

    return id;
};

export const toast = {
    success: (title: string, description?: string, options?: ToastOptions) => createToast("success", title, description, options),

    error: (title: string, description?: string, options?: ToastOptions) => createToast("error", title, description, options),

    warning: (title: string, description?: string, options?: ToastOptions) => createToast("warning", title, description, options),

    info: (title: string, description?: string, options?: ToastOptions) => createToast("info", title, description, options),

    custom: (type: ToastType, title: string, description?: string, options?: ToastOptions) => createToast(type, title, description, options),
};

export const removeToast = (id: string) => {
    toasts.set(toasts.get().filter((toast) => toast.id !== id));
};

export const clearToasts = () => {
    toasts.set([]);
};
