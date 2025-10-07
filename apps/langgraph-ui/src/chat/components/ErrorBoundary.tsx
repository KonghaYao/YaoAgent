import React from "react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
        // 更新 state 以便下一次渲染将显示回退 UI
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // 你也可以将错误日志上报给服务器
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // 你可以渲染任何自定义的回退 UI
            return (
                <div className="flex items-center justify-center h-full w-full">
                    <div className="bg-white rounded-2xl px-8 py-6 text-center">
                        <h1 className="text-lg font-semibold text-red-500 mb-2">出错了！</h1>
                        <p className="text-sm text-gray-600">请稍后重试。</p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
