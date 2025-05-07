import React, { useState } from "react";
import "./Login.css";

interface HeaderConfig {
    key: string;
    value: string;
}

const Login: React.FC = () => {
    const [headers, setHeaders] = useState<HeaderConfig[]>([{ key: "authorization", value: "" }]);

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
                <p>登录测试，自定义请求头配置</p>
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
                                placeholder="例如: Bearer token"
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
