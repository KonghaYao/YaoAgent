import React, { useState } from "react";
import "./Login.css";

interface HeaderConfig {
    key: string;
    value: string;
}

const Login: React.FC = () => {
    const [headers, setHeaders] = useState<HeaderConfig[]>([{ key: "authorization", value: "" }]);
    const [withCredentials, setWithCredentials] = useState<boolean>(localStorage.getItem("withCredentials") === "true");
    const [apiUrl, setApiUrl] = useState<string>(localStorage.getItem("apiUrl") || "");

    const addHeader = () => {
        setHeaders([...headers, { key: "", value: "" }]);
    };

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index));
    };

    const updateHeader = (index: number, field: "key" | "value", value: string) => {
        const newHeaders = [...headers];
        newHeaders[index][field] = value;
        setHeaders(newHeaders);
    };

    const handleLogin = () => {
        const headerObject = Object.fromEntries(headers.map((k) => [k.key, k.value]));

        localStorage.setItem("code", JSON.stringify(headerObject));
        localStorage.setItem("withCredentials", JSON.stringify(withCredentials));
        localStorage.setItem("apiUrl", apiUrl);
        location.reload();
    };

    return (
        <div className="login-container">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin();
                }}
            >
                <h2>LangGraph UI</h2>
                <p>登录，自定义请求头配置</p>

                <div className="form-group api-url-group">
                    <label htmlFor="api-url">API URL</label>
                    <input type="text" id="api-url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="例如: http://localhost:8123" />
                </div>

                {headers.map((header, index) => (
                    <div key={index} className="header-group">
                        <div className="form-group">
                            <input type="text" id={`header-key-${index}`} value={header.key} onChange={(e) => updateHeader(index, "key", e.target.value)} placeholder="例如: authorization" required />
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                id={`header-value-${index}`}
                                value={header.value}
                                onChange={(e) => updateHeader(index, "value", e.target.value)}
                                placeholder="例如: Bearer token；无则填 1"
                                required
                            />
                        </div>
                        {index > 0 && (
                            <button type="button" className="remove-header" onClick={() => removeHeader(index)}>
                                删除
                            </button>
                        )}
                    </div>
                ))}
                <div className="with-credentials-option">
                    <label>
                        <input type="checkbox" checked={withCredentials} onChange={(e) => setWithCredentials(e.target.checked)} />
                        启用 withCredentials（跨域请求时发送 Cookie）
                    </label>
                </div>
                <div className="button-group">
                    <button type="button" onClick={addHeader}>
                        添加请求头
                    </button>
                    <button type="submit">保存配置</button>
                </div>
            </form>
        </div>
    );
};

export default Login;
