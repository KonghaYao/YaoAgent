import {
    ListResponse,
    MkdirResponse,
    RenameResponse,
    MoveResponse,
    CopyResponse,
    RemoveResponse,
    UploadResponse,
    SearchResponse,
    DirsResponse,
    OfflineDownloadResponse,
} from "./types.js";
import { AlistAuth } from "./auth.js";

const API_BASE_URL = process.env.ALIST_API_URL || "http://localhost:5244/api";

export class AlistFS {
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

    async list(path: string, password?: string, page = 1, per_page = 0, refresh = false): Promise<ListResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/list`, {
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
                refresh,
            }),
        });

        return response.json();
    }

    async mkdir(path: string): Promise<MkdirResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/mkdir`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ path }),
        });

        return response.json();
    }

    async rename(path: string, name: string): Promise<RenameResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/rename`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ path, name }),
        });

        return response.json();
    }

    async move(src_dir: string, dst_dir: string, names: string[]): Promise<MoveResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/move`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ src_dir, dst_dir, names }),
        });

        return response.json();
    }

    async copy(src_dir: string, dst_dir: string, names: string[]): Promise<CopyResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/copy`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ src_dir, dst_dir, names }),
        });

        return response.json();
    }

    async remove(dir: string, names: string[]): Promise<RemoveResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/remove`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ dir, names }),
        });

        return response.json();
    }

    async upload(path: string, file: File, asTask = false): Promise<UploadResponse> {
        const token = await this.getToken();
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE_URL}/fs/form`, {
            method: "PUT",
            headers: {
                Authorization: token,
                "File-Path": encodeURIComponent(path),
                "As-Task": asTask.toString(),
            },
            body: formData,
        });

        return response.json();
    }

    async search(
        parent: string,
        keywords: string,
        scope: 0 | 1 | 2 = 0,
        page = 1,
        per_page = 0,
        password?: string
    ): Promise<SearchResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/search`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                parent,
                keywords,
                scope,
                page,
                per_page,
                password,
            }),
        });

        return response.json();
    }

    async dirs(path: string, password?: string, force_root = false): Promise<DirsResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/dirs`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                path,
                password,
                force_root,
            }),
        });

        return response.json();
    }

    async batchRename(src_dir: string, rename_objects: Array<{ src_name: string; new_name: string }>): Promise<{ code: number; message: string; data: null }> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/batch_rename`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                src_dir,
                rename_objects,
            }),
        });

        return response.json();
    }

    async regexRename(src_dir: string, src_name_regex: string, new_name_regex: string): Promise<{ code: number; message: string; data: null }> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/regex_rename`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                src_dir,
                src_name_regex,
                new_name_regex,
            }),
        });

        return response.json();
    }

    async recursiveMove(src_dir: string, dst_dir: string): Promise<{ code: number; message: string; data: null }> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/recursive_move`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                src_dir,
                dst_dir,
            }),
        });

        return response.json();
    }

    async removeEmptyDirectory(src_dir: string): Promise<{ code: number; message: string; data: null }> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/remove_empty_directory`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                src_dir,
            }),
        });

        return response.json();
    }

    async addOfflineDownload(
        path: string,
        urls: string[],
        tool: "aria2" | "SimpleHttp" | "qBittorrent" = "SimpleHttp",
        delete_policy: "delete_on_upload_succeed" | "delete_on_upload_failed" | "delete_never" | "delete_always" = "delete_on_upload_succeed"
    ): Promise<OfflineDownloadResponse> {
        const token = await this.getToken();
        const response = await fetch(`${API_BASE_URL}/fs/add_offline_download`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                path,
                urls,
                tool,
                delete_policy,
            }),
        });

        return response.json();
    }
}
