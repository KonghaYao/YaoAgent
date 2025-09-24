import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // 更新 state 以便下一次渲染将显示回退 UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // 你也可以将错误日志上报给服务器
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // 你可以渲染任何自定义的回退 UI
            return <h1>出错了！请稍后重试。</h1>;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
