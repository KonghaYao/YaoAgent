import { IDBPDatabase } from "idb";

/**
 * 数据库记录的基本接口
 */
export interface BaseRecord {
    id?: number;
    [key: string]: any;
}

/**
 * 数据库配置的基本接口
 */
export interface BaseDBConfig {
    dbName: string;
    dbVersion: number;
    storeName: string;
}

/**
 * 数据库操作的抽象基类
 */
export abstract class BaseDB<T extends BaseRecord> {
    protected isInitialized: boolean = false;
    protected config: BaseDBConfig;

    constructor(config: BaseDBConfig) {
        this.config = config;
    }

    /**
     * 初始化数据库
     */
    public abstract initialize(): Promise<void>;

    /**
     * 添加记录
     */
    public abstract insert(record: Partial<T>): Promise<number>;

    /**
     * 更新记录
     */
    public abstract update(id: number, record: Partial<T>): Promise<void>;

    /**
     * 删除记录
     */
    public abstract delete(id: number): Promise<void>;

    /**
     * 查询记录
     */
    public abstract query(
        query: string,
        options?: {
            prefix?: boolean;
            fields?: string[];
            limit?: number;
            fuzzy?: number;
        }
    ): Promise<T[]>;

    public abstract get(id: number): Promise<T | undefined>;

    /**
     * 获取所有记录
     */
    public abstract getAll(): Promise<T[]>;
}

// 定义向量类型
export type Vector = number[];
// 定义数据库记录类型
export interface MemoryRecord extends BaseRecord {
    vector?: Vector | BigUint64Array;
    text: string;
    /**
     * 记忆存储的路径，与 Linux 文件系统一致
     * @example memory://user_id/path/to/memory
     */
    path: string;
    /**
     * 引用文档的 path
     */
    referencePath?: string;
    type: string;
    /**
     * 记忆的标签，用于检索
     */
    tags: string[];
}
