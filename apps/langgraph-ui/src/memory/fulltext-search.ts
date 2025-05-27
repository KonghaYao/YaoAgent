// minisearch-idb-chinese-search.ts

import MiniSearch, { AsPlainObject, type Options, type SearchOptions, type SearchResult } from "minisearch";
import { openDB, type IDBPDatabase } from "idb";
import { BaseDB, BaseRecord, BaseDBConfig } from "./base-db";
import { MemoryRecord } from "./db";

/**
 * 搜索服务配置接口
 */
export interface FullTextSearchConfig extends BaseDBConfig {
    miniSearchOptions?: Partial<Options<MemoryRecord>>;
}

// 默认配置
const DEFAULT_CONFIG: Required<FullTextSearchConfig> = {
    dbName: "minisearch_memory_db",
    dbVersion: 1,
    storeName: "memory",
    miniSearchOptions: {
        fields: ["text"],
        storeFields: ["text"],
        tokenize: chineseWordSegmenter,
    },
};

// --- 1. 中文分词器 ---
/**
 * 中文分词器，使用 Intl.Segmenter 将中文文本分割成词语。
 * @param text 需要分词的中文文本。
 * @returns 词语数组。
 */
function chineseWordSegmenter(text: string): string[] {
    // 移除所有空格，因为中文词语之间通常没有空格
    const cleanText = text.replace(/ /g, "");

    // 使用 Intl.Segmenter 进行词语分词
    // 'zh-CN' 或 'cn' 都可以表示中文（中国大陆）
    const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });

    // 获取分词结果并只保留词语内容
    const segments = Array.from(segmenter.segment(cleanText)).map((item) => item.segment);

    return segments;
}

export class FullTextSearchService extends BaseDB<MemoryRecord> {
    private miniSearch!: MiniSearch<MemoryRecord>;
    protected config: Required<FullTextSearchConfig>;
    protected db!: IDBPDatabase;
    constructor(config?: FullTextSearchConfig) {
        const mergedConfig = {
            ...DEFAULT_CONFIG,
            ...config,
            miniSearchOptions: {
                ...DEFAULT_CONFIG.miniSearchOptions,
                ...(config?.miniSearchOptions || {}),
            },
        };
        super(mergedConfig);
        this.config = mergedConfig;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        const { storeName } = this.config;
        this.db = await openDB(this.config.dbName, this.config.dbVersion, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains("minisearch_index")) {
                    db.createObjectStore("minisearch_index");
                }
            },
        });

        // 确保 miniSearchOptions 包含所有必需的字段
        const miniSearchOptions: Options<MemoryRecord> = {
            fields: this.config.miniSearchOptions.fields || ["text"],
            storeFields: this.config.miniSearchOptions.storeFields || ["text"],
            tokenize: this.config.miniSearchOptions.tokenize || chineseWordSegmenter,
        };

        this.miniSearch = new MiniSearch(miniSearchOptions);

        try {
            const savedIndex = await this.loadMiniSearchIndex();
            if (savedIndex) {
                await MiniSearch.loadJSAsync(savedIndex, miniSearchOptions);
                console.log("MiniSearch index loaded from IndexedDB.");
            } else {
                console.log("No saved index found, building from documents...");
                const allDocs = await this.getAll();
                if (allDocs.length > 0) {
                    this.miniSearch.addAll(allDocs);
                    await this.saveMiniSearchIndex(this.miniSearch.toJSON());
                    console.log(`MiniSearch index built from ${allDocs.length} documents and saved.`);
                } else {
                    console.log("No documents found, index is empty.");
                }
            }
            this.isInitialized = true;
        } catch (error) {
            console.error("Failed to initialize FullTextSearchService:", error);
            throw error;
        }
    }

    public async insert(doc: Partial<MemoryRecord>): Promise<number> {
        const transaction = this.db.transaction(this.config.storeName, "readwrite");
        const store = transaction.objectStore(this.config.storeName);
        const newDoc: MemoryRecord = { ...doc } as MemoryRecord;

        const id = await store.add(newDoc);
        newDoc.id = Number(id);

        await transaction.done;

        this.miniSearch.add(newDoc);
        await this.saveMiniSearchIndex(this.miniSearch.toJSON());

        return newDoc.id;
    }

    public async update(id: number, doc: Partial<MemoryRecord>): Promise<void> {
        const transaction = this.db.transaction(this.config.storeName, "readwrite");
        const store = transaction.objectStore(this.config.storeName);
        const updatedDoc = { ...doc, id } as MemoryRecord;
        await store.put(updatedDoc);

        // MiniSearch 没有 update 方法，我们需要先删除再添加
        const existingDoc = await store.get(id);
        if (existingDoc) {
            this.miniSearch.remove(existingDoc);
        }
        this.miniSearch.add(updatedDoc);
        await this.saveMiniSearchIndex(this.miniSearch.toJSON());
    }

    public async delete(id: number): Promise<void> {
        const transaction = this.db.transaction(this.config.storeName, "readwrite");
        const store = transaction.objectStore(this.config.storeName);
        const doc = await store.get(id);
        if (doc) {
            this.miniSearch.remove(doc);
        }
        await store.delete(id);
        await this.saveMiniSearchIndex(this.miniSearch.toJSON());
    }

    public async query(query: string, options?: SearchOptions & { limit?: number }): Promise<MemoryRecord[]> {
        const results = this.miniSearch.search(query, options);
        // 将 SearchResult 转换为 MemoryRecord
        return results.map((result) => {
            const { id, text, ...rest } = result;
            return {
                id,
                text,
                ...rest,
            } as MemoryRecord;
        });
    }

    public async getAll(): Promise<MemoryRecord[]> {
        return this.db.transaction(this.config.storeName, "readonly").objectStore(this.config.storeName).getAll();
    }

    private async loadMiniSearchIndex(): Promise<AsPlainObject | null> {
        return this.db.transaction("minisearch_index", "readonly").objectStore("minisearch_index").get("indexData");
    }

    private async saveMiniSearchIndex(indexData: AsPlainObject): Promise<void> {
        const tx = this.db.transaction("minisearch_index", "readwrite");
        const store = tx.objectStore("minisearch_index");
        await store.put(indexData, "indexData");
        await tx.done;
    }
}
