import { BytesLineDecoder, SSEDecoder } from "./utils/sse.js";
import { LangGraphClientConfig } from "../LangGraphClient.js";
import { ILangGraphClient } from "@langgraph-js/pure-graph/dist/types.js";

const REGEX_RUN_METADATA = /(\/threads\/(?<thread_id>.+))?\/runs\/(?<run_id>.+)/;
function getRunMetadataFromResponse(response: Response) {
    const contentLocation = response.headers.get("Content-Location");
    if (!contentLocation) return void 0;
    const match = REGEX_RUN_METADATA.exec(contentLocation);
    if (!match?.groups?.run_id) return void 0;
    return {
        run_id: match.groups.run_id,
        thread_id: match.groups.thread_id || void 0,
    };
}
import { Client } from "@langchain/langgraph-sdk";

export const createLowerJSClient = (config: Omit<LangGraphClientConfig, "client">): ILangGraphClient => {
    const client = new Client(config);
    /** @ts-ignore */
    client.runs.joinStream = async function (this: any, threadId: string | null, runId: string, options: any) {
        const opts = typeof options === "object" && options != null && options instanceof AbortSignal ? { signal: options } : options;
        let [url, init] = this.prepareFetchOptions(threadId != null ? `/threads/${threadId}/runs/${runId}/stream` : `/runs/${runId}/stream`, {
            method: "GET",
            timeoutMs: null,
            signal: opts?.signal,
            headers: opts?.lastEventId ? { "Last-Event-ID": opts.lastEventId } : void 0,
            params: {
                cancel_on_disconnect: opts?.cancelOnDisconnect ? "1" : "0",
                stream_mode: opts?.streamMode,
            },
        });
        if (this.onRequest != null) init = await this.onRequest(url, init);
        const response = await this.asyncCaller.fetch(url, init);
        const stream: ReadableStream = (response.body || new ReadableStream({ start: (ctrl) => ctrl.close() })).pipeThrough(BytesLineDecoder()).pipeThrough(SSEDecoder());
        return stream.pipeTo(new WritableStream({ write: (chunk) => options.onCallback?.(chunk) }));
    }.bind(client.runs);
    /** @ts-ignore */
    client.runs.stream = async function (this: any, threadId: string | null, assistantId: string, payload?: any) {
        const json = {
            input: payload?.input,
            command: payload?.command,
            config: payload?.config,
            context: payload?.context,
            metadata: payload?.metadata,
            stream_mode: payload?.streamMode,
            stream_subgraphs: payload?.streamSubgraphs,
            stream_resumable: payload?.streamResumable,
            feedback_keys: payload?.feedbackKeys,
            assistant_id: assistantId,
            interrupt_before: payload?.interruptBefore,
            interrupt_after: payload?.interruptAfter,
            checkpoint: payload?.checkpoint,
            checkpoint_id: payload?.checkpointId,
            webhook: payload?.webhook,
            multitask_strategy: payload?.multitaskStrategy,
            on_completion: payload?.onCompletion,
            on_disconnect: payload?.onDisconnect,
            after_seconds: payload?.afterSeconds,
            if_not_exists: payload?.ifNotExists,
            checkpoint_during: payload?.checkpointDuring,
            durability: payload?.durability,
        };
        const endpoint = threadId == null ? `/runs/stream` : `/threads/${threadId}/runs/stream`;
        let [url, init] = this.prepareFetchOptions(endpoint, {
            method: "POST",
            json,
            timeoutMs: null,
            signal: payload?.signal,
        });
        if (this.onRequest != null) init = await this.onRequest(url, init);
        const response = await this.asyncCaller.fetch(url, init);
        const runMetadata = getRunMetadataFromResponse(response);
        if (runMetadata) payload?.onRunCreated?.(runMetadata);
        const stream: ReadableStream = (response.body || new ReadableStream({ start: (ctrl) => ctrl.close() })).pipeThrough(BytesLineDecoder()).pipeThrough(SSEDecoder());

        return stream.pipeTo(new WritableStream({ write: (chunk) => payload.onCallback?.(chunk) }));
    }.bind(client.runs);
    return client as ILangGraphClient;
};
