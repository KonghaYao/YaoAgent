import { PublicListResponse, PublicGetResponse } from "./types.js";
import { AlistAuth } from "./auth.js";

const API_BASE_URL = process.env.ALIST_API_URL || "http://localhost:5244/api";

export class AlistPublic {
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

    async list(path: string, password?: string, page = 1, per_page = 0): Promise<PublicListResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/public/list`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                path,
                password,
                page,
                per_page,
            }),
        });

        return response.json();
    }

    async get(path: string, password?: string): Promise<PublicGetResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/public/get`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                path,
                password,
            }),
        });

        return response.json();
    }
}
