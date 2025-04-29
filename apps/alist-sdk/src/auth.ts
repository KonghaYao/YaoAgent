import { LoginResponse, UserInfoResponse, TwoFactorResponse } from "./types.js";

const API_BASE_URL = process.env.ALIST_API_URL || "http://localhost:5244/api";

export class AlistAuth {
    private token: string | null = null;

    async login(username: string, password: string, otpCode?: string): Promise<LoginResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
                otp_code: otpCode,
            }),
        });

        const data = await response.json();
        if (data.code === 200) {
            this.token = data.data.token;
        }
        return data;
    }

    async loginWithHash(username: string, passwordHash: string, otpCode?: string): Promise<LoginResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/login/hash`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password: passwordHash,
                otp_code: otpCode,
            }),
        });

        const data = await response.json();
        if (data.code === 200) {
            this.token = data.data.token;
        }
        return data;
    }

    async generate2FA(): Promise<TwoFactorResponse> {
        if (!this.token) {
            throw new Error("Not authenticated");
        }

        const response = await fetch(`${API_BASE_URL}/auth/2fa/generate`, {
            method: "POST",
            headers: {
                Authorization: this.token,
            },
        });

        return response.json();
    }

    async verify2FA(code: string, secret: string): Promise<{ code: number; message: string; data: null }> {
        if (!this.token) {
            throw new Error("Not authenticated");
        }

        const response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
            method: "POST",
            headers: {
                Authorization: this.token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code, secret }),
        });

        return response.json();
    }

    async getUserInfo(): Promise<UserInfoResponse> {
        if (!this.token) {
            throw new Error("Not authenticated");
        }

        const response = await fetch(`${API_BASE_URL}/me`, {
            headers: {
                Authorization: this.token,
            },
        });

        return response.json();
    }

    getToken(): string | null {
        return this.token;
    }

    setToken(token: string): void {
        this.token = token;
    }
}
