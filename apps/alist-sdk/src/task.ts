import { TaskResponse } from "./types.js";
import { AlistAuth } from "./auth.js";

const API_BASE_URL = process.env.ALIST_API_URL || "http://localhost:5244/api";

export class AlistTask {
    private auth: AlistAuth;

    constructor(auth: AlistAuth) {
        this.auth = auth;
    }

    private async getToken(): Promise<string> {
        const token = this.auth.getToken();
        if (!token) {
            throw new Error("Not authenticated");
        }
        return token;
    }

    async list(): Promise<TaskResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/task/list`, {
            headers: {
                Authorization: token,
            },
        });

        return response.json();
    }

    async cancel(id: string): Promise<{ code: number; message: string; data: null }> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/task/cancel`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
        });

        return response.json();
    }

    async delete(id: string): Promise<{ code: number; message: string; data: null }> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/task/delete`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
        });

        return response.json();
    }

    async clear(): Promise<{ code: number; message: string; data: null }> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/task/clear`, {
            method: "POST",
            headers: {
                Authorization: token,
            },
        });

        return response.json();
    }

    async retry(id: string): Promise<{ code: number; message: string; data: null }> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/task/retry`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
        });

        return response.json();
    }
}
