import { FullTextSearchService, createMemoryTool } from "../../memory/index";

// const vectorizer = new OpenAIVectorizer("text-embedding-3-small", {
//     apiKey: import.meta.env.VITE_MEMORY_API_KEY,
//     apiEndpoint: import.meta.env.VITE_MEMORY_API_ENDPOINT,
// });
// const db = new VecDB({
//     vectorizer,
//     dbName: "memory_db",
//     dbVersion: 1,
//     storeName: "memory",
// });
const db = new FullTextSearchService({
    dbName: "memory_fulltext_db",
    dbVersion: 1,
    storeName: "memory",
});
db.initialize();
console.log(db);
export const memoryTool = createMemoryTool(db);

export const setLocalConfig = (config: Partial<{ showHistory: boolean; showGraph: boolean }>) => {
    Object.entries(config).forEach(([key, value]) => {
        localStorage.setItem(key, value.toString());
    });
};
