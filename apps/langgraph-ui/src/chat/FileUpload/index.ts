/**
 * File Upload SDK - Base client for file upload services
 */

// Base interfaces
interface FileUploadClientOptions {
    apiUrl?: string;
}

interface FileUploadOptions {
    filename?: string;
    signal?: AbortSignal;
}

interface FileUploadResponse {
    status: string;
    data?: {
        url: string;
        delete_url?: string;
        expires_at?: string;
        size?: number;
        [key: string]: any;
    };
    [key: string]: any;
}

// Abstract base class for file upload clients
abstract class FileUploadClient {
    protected apiUrl: string;

    constructor(options: FileUploadClientOptions = {}) {
        this.apiUrl = options.apiUrl || "";
    }

    protected abstract getUploadEndpoint(): string;
    protected abstract processResponse(response: FileUploadResponse): FileUploadResponse;

    protected createFormData(file: File | Blob | string, filename?: string): FormData {
        const formData = new FormData();

        if (typeof file === "string") {
            const blob = new Blob([file], { type: "text/plain" });
            formData.append("file", blob, filename || "file.txt");
        } else {
            formData.append("file", file, filename || (file instanceof File ? file.name : "file"));
        }

        return formData;
    }

    public async upload(file: File | Blob | string, options: FileUploadOptions = {}): Promise<FileUploadResponse> {
        const formData = this.createFormData(file, options.filename);

        const fetchOptions: RequestInit = {
            method: "POST",
            body: formData,
        };

        if (options.signal) {
            fetchOptions.signal = options.signal;
        }

        try {
            const response = await fetch(`${this.apiUrl}${this.getUploadEndpoint()}`, fetchOptions);

            if (!response.ok) {
                throw new Error(`Upload failed with status: ${response.status}`);
            }

            const result = (await response.json()) as FileUploadResponse;
            return this.processResponse(result);
        } catch (error) {
            throw new Error(`File upload failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

/**
 * TmpFiles SDK - A client for uploading files to tmpfiles.org
 */
export class TmpFilesClient extends FileUploadClient {
    constructor(options: FileUploadClientOptions = {}) {
        super({
            apiUrl: options.apiUrl || "https://tmpfiles.org/api/v1",
        });
    }

    protected getUploadEndpoint(): string {
        return "/upload";
    }

    protected processResponse(response: FileUploadResponse): FileUploadResponse {
        if (response.data?.url) {
            response.data.url = response.data.url.replace("//tmpfiles.org/", "//tmpfiles.org/dl/");
        }
        return response;
    }
}

// Export types for external use
export type { FileUploadClientOptions, FileUploadOptions, FileUploadResponse };
