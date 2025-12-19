import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // 更新 state 以便下一次渲染将显示回退 UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // 将错误日志上报给服务器或控制台
        console.error("ErrorBoundary 捕获到错误:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // 如果提供了自定义 fallback，使用它
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // 默认的错误 UI，与整体风格一致
            return (
                <div className="w-full p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-red-900 mb-1">组件加载失败</h3>
                            <p className="text-xs text-red-700">
                                {this.state.error?.message || "发生了未知错误，请刷新页面重试。"}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
