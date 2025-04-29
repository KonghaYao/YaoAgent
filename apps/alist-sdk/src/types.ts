// Auth types
export interface LoginResponse {
    code: number;
    message: string;
    data: {
        token: string;
    };
}

export interface UserInfo {
    id: number;
    username: string;
    password: string;
    base_path: string;
    role: number;
    disabled: boolean;
    permission: number;
    sso_id: string;
    otp: boolean;
}

export interface UserInfoResponse {
    code: number;
    message: string;
    data: {
        id: number;
        username: string;
        password: string;
        base_path: string;
        role: number;
        disabled: boolean;
        permission: number;
        sso_id: string;
        otp: boolean;
    };
}

export interface TwoFactorResponse {
    code: number;
    message: string;
    data: {
        secret: string;
        qrcode: string;
    };
}

// FS types
export interface FileInfo {
    name: string;
    size: number;
    is_dir: boolean;
    modified: string;
    sign: string;
    thumb: string;
    type: number;
}

export interface ListResponse {
    code: number;
    message: string;
    data: {
        content: FileInfo[];
        total: number;
        readme: string;
        write: boolean;
        provider: string;
    };
}

export interface MkdirResponse {
    code: number;
    message: string;
    data: null;
}

export interface RenameResponse {
    code: number;
    message: string;
    data: null;
}

export interface MoveResponse {
    code: number;
    message: string;
    data: null;
}

export interface CopyResponse {
    code: number;
    message: string;
    data: null;
}

export interface RemoveResponse {
    code: number;
    message: string;
    data: null;
}

// Task types
export interface TaskInfo {
    id: string;
    name: string;
    state: number;
    status: string;
    progress: number;
    error: string;
}

export interface TaskResponse {
    code: number;
    message: string;
    data: {
        tasks: TaskInfo[];
    };
}

// Public types
export interface PublicListResponse {
    code: number;
    message: string;
    data: {
        content: FileInfo[];
        total: number;
        readme: string;
        provider: string;
    };
}

export interface PublicGetResponse {
    code: number;
    message: string;
    data: {
        name: string;
        size: number;
        is_dir: boolean;
        modified: string;
        sign: string;
        thumb: string;
        type: number;
        raw_url: string;
        readme: string;
        provider: string;
    };
}

export interface UploadResponse {
    code: number;
    message: string;
    data: {
        task: {
            id: string;
            name: string;
            state: number;
            status: string;
            progress: number;
            error: string;
        };
    };
}

export interface SearchResponse {
    code: number;
    message: string;
    data: {
        content: Array<{
            parent: string;
            name: string;
            is_dir: boolean;
            size: number;
            type: number;
        }>;
        total: number;
    };
}

export interface DirsResponse {
    code: number;
    message: string;
    data: Array<{
        name: string;
        modified: string;
    }>;
}

export interface OfflineDownloadResponse {
    code: number;
    message: string;
    data: {
        tasks: Array<{
            id: string;
            name: string;
            state: number;
            status: string;
            progress: number;
            error: string;
        }>;
    };
}
