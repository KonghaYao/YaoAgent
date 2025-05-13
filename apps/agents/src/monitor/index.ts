import { CallbackHandler } from "langfuse-langchain";
export const langfuseHandler = new CallbackHandler({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL,
    sampleRate: 1,
});
console.log("Langfuse 监控已开启");
export default [langfuseHandler];
