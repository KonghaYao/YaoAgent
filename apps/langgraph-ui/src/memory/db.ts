import { openDB, DBSchema, IDBPDatabase } from "idb";

// 定义向量类型
type Vector = number[];
type BinaryVector = number[];

// 定义数据库记录类型
interface VectorRecord {
    id?: number;
    vector?: Vector | BigUint64Array;
    text: string;
    [key: string]: any;
}

// 定义数据库模式
interface VecDBSchema extends DBSchema {
    vectors: {
        key: number;
        value: VectorRecord;
    };
}

// 定义默认模型类型
const defaultModel = "default";

// 向量化文本的抽象基类
abstract class TextVectorizer {
    protected model: string;

    constructor(model: string = defaultModel) {
        this.model = model;
    }

    abstract vectorize(text: string): Promise<Vector>;
}

class OpenAIVectorizer extends TextVectorizer {
    private apiKey: string;
    public apiEndpoint: string;

    constructor(model: string = "text-embedding-ada-002", { apiKey, apiEndpoint }: { apiKey: string; apiEndpoint: string }) {
        super(model);
        this.apiKey = apiKey;
        this.apiEndpoint = apiEndpoint;
    }

    async vectorize(text: string): Promise<Vector> {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    input: text,
                    model: this.model,
                }),
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data[0].embedding;
        } catch (error) {
            throw new Error(`Error vectorizing text: ${error}`);
        }
    }
}
const cosineSimilarity = (vecA: Vector, vecB: Vector): number => {
    const dotProduct = vecA.reduce((sum: number, val: number, index: number) => sum + val * vecB[index], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum: number, val: number) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum: number, val: number) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
};

const binarizeVector = (vector: Vector, threshold: number | null = null): BinaryVector => {
    if (threshold === null) {
        const sorted = [...vector].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        threshold = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }
    return vector.map((val: number) => (val >= threshold! ? 1 : 0));
};

interface EntityDBConfig {
    vectorPath: string;
    vectorizer: TextVectorizer;
}

interface QueryOptions {
    limit?: number;
}

class VecDB {
    private vectorPath: string;
    private vectorizer: TextVectorizer;
    private dbPromise: Promise<IDBPDatabase<VecDBSchema>>;

    constructor({ vectorPath, vectorizer }: EntityDBConfig) {
        this.vectorPath = vectorPath;
        this.vectorizer = vectorizer;
        this.dbPromise = this._initDB();
    }

    // Initialize the IndexedDB
    private async _initDB(): Promise<IDBPDatabase<VecDBSchema>> {
        const db = await openDB<VecDBSchema>("EntityDB", 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains("vectors")) {
                    db.createObjectStore("vectors", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                }
            },
        });
        return db;
    }

    // Insert data by generating embeddings from text
    async insert(data: VectorRecord): Promise<number> {
        try {
            let embedding = data[this.vectorPath] as Vector;
            if (data.text) {
                embedding = await this.vectorizer.vectorize(data.text);
            }

            const db = await this.dbPromise;
            const transaction = db.transaction("vectors", "readwrite");
            const store = transaction.objectStore("vectors");
            const { vector: _, ...rest } = data;
            const record = { vector: embedding, ...rest };
            const key = await store.add(record);
            return key;
        } catch (error) {
            throw new Error(`Error inserting data: ${error}`);
        }
    }

    async insertBinary(data: VectorRecord): Promise<number> {
        try {
            let embedding = data[this.vectorPath] as Vector;
            if (data.text) {
                embedding = await this.vectorizer.vectorize(data.text);
            }

            const binaryEmbedding = binarizeVector(embedding);
            const packedEmbedding = new BigUint64Array(new ArrayBuffer(Math.ceil(binaryEmbedding.length / 64) * 8));
            for (let i = 0; i < binaryEmbedding.length; i++) {
                const bitIndex = i % 64;
                const arrayIndex = Math.floor(i / 64);
                if (binaryEmbedding[i] === 1) {
                    packedEmbedding[arrayIndex] |= 1n << BigInt(bitIndex);
                }
            }

            const db = await this.dbPromise;
            const transaction = db.transaction("vectors", "readwrite");
            const store = transaction.objectStore("vectors");
            const { vector: _, ...rest } = data;
            const record = { vector: packedEmbedding, ...rest };
            const key = await store.add(record);
            return key;
        } catch (error) {
            throw new Error(`Error inserting binary data: ${error}`);
        }
    }

    async update(key: number, data: VectorRecord): Promise<void> {
        const db = await this.dbPromise;
        const transaction = db.transaction("vectors", "readwrite");
        const store = transaction.objectStore("vectors");
        const vector = data[this.vectorPath] as Vector;
        const updatedData = { ...data, id: key, vector };
        await store.put(updatedData);
    }

    async delete(key: number): Promise<void> {
        const db = await this.dbPromise;
        const transaction = db.transaction("vectors", "readwrite");
        const store = transaction.objectStore("vectors");
        await store.delete(key);
    }

    async query(queryText: string, { limit = 10 }: QueryOptions = {}): Promise<Array<VectorRecord & { similarity: number }>> {
        try {
            const queryVector = await this.vectorizer.vectorize(queryText);
            const db = await this.dbPromise;
            const transaction = db.transaction("vectors", "readonly");
            const store = transaction.objectStore("vectors");
            const vectors = await store.getAll();

            const similarities = vectors.map((entry) => {
                const vector = entry.vector as Vector;
                const similarity = cosineSimilarity(queryVector, vector);
                return { ...entry, similarity };
            });

            similarities.sort((a, b) => b.similarity - a.similarity);
            return similarities.slice(0, limit);
        } catch (error) {
            throw new Error(`Error querying vectors: ${error}`);
        }
    }
}

export { VecDB, TextVectorizer, OpenAIVectorizer };
export type { Vector, BinaryVector, VectorRecord };
