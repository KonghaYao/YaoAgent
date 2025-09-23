import {
    Thread,
    Assistant,
    Run,
    StreamMode,
    Command,
    Metadata,
    AssistantGraph,
    OnConflictBehavior,
    ThreadStatus,
    ValuesStreamEvent,
    UpdatesStreamEvent,
    DebugStreamEvent,
    MessagesStreamEvent,
    MessagesTupleStreamEvent,
    CustomStreamEvent,
    EventsStreamEvent,
    ErrorStreamEvent,
    MetadataStreamEvent,
    FeedbackStreamEvent,
    Config,
    Checkpoint,
} from "@langchain/langgraph-sdk";
import { StreamEvent } from "@langchain/core/tracers/log_stream";

// 基础类型定义
export type AssistantSortBy = "assistant_id" | "graph_id" | "name" | "created_at" | "updated_at";
export type ThreadSortBy = "thread_id" | "status" | "created_at" | "updated_at";
export type SortOrder = "asc" | "desc";
export type RunStatus = "pending" | "running" | "error" | "success" | "timeout" | "interrupted";
export type MultitaskStrategy = "reject" | "interrupt" | "rollback" | "enqueue";
export type DisconnectMode = "cancel" | "continue";
export type OnCompletionBehavior = "complete" | "continue";
export type CancelAction = "interrupt" | "rollback";

// 流式异步生成器类型
export type TypedAsyncGenerator<TStateType = unknown, TUpdateType = TStateType, TCustomType = unknown> = AsyncGenerator<
    | {
          values: ValuesStreamEvent<TStateType>;
          updates: UpdatesStreamEvent<TUpdateType>;
          custom: CustomStreamEvent<TCustomType>;
          debug: DebugStreamEvent;
          messages: MessagesStreamEvent;
          "messages-tuple": MessagesTupleStreamEvent;
          events: EventsStreamEvent;
      }[StreamMode]
    | ErrorStreamEvent
    | MetadataStreamEvent
    | FeedbackStreamEvent
>;

/**
 * 兼容 LangGraph SDK 的接口定义，方便进行无侵入式的扩展
 */
export interface ILangGraphClient<TStateType = unknown, TUpdateType = TStateType> {
    assistants: {
        search(query?: { graphId?: string; metadata?: Metadata; limit?: number; offset?: number; sortBy?: AssistantSortBy; sortOrder?: SortOrder }): Promise<Assistant[]>;
        getGraph(assistantId: string, options?: { xray?: boolean | number }): Promise<AssistantGraph>;
    };
    threads: {
        create(payload?: {
            metadata?: Metadata;
            threadId?: string;
            ifExists?: OnConflictBehavior;
            graphId?: string;
            supersteps?: Array<{
                updates: Array<{
                    values: unknown;
                    command?: Command;
                    asNode: string;
                }>;
            }>;
        }): Promise<Thread<TStateType>>;
        search(query?: { metadata?: Metadata; limit?: number; offset?: number; status?: ThreadStatus; sortBy?: ThreadSortBy; sortOrder?: SortOrder }): Promise<Thread<TStateType>[]>;
        get(threadId: string): Promise<Thread<TStateType>>;
        delete(threadId: string): Promise<void>;
    };
    runs: {
        list(
            threadId: string,
            options?: {
                limit?: number;
                offset?: number;
                status?: RunStatus;
            }
        ): Promise<Run[]>;

        stream<TSubgraphs extends boolean = false>(
            threadId: string,
            assistantId: string,
            payload?: {
                input?: Record<string, unknown> | null;
                metadata?: Metadata;
                config?: Config;
                checkpointId?: string;
                checkpoint?: Omit<Checkpoint, "thread_id">;
                checkpointDuring?: boolean;
                interruptBefore?: "*" | string[];
                interruptAfter?: "*" | string[];
                multitaskStrategy?: MultitaskStrategy;
                onCompletion?: OnCompletionBehavior;
                signal?: AbortController["signal"];
                webhook?: string;
                onDisconnect?: DisconnectMode;
                afterSeconds?: number;
                ifNotExists?: "create" | "reject";
                command?: Command;
                onRunCreated?: (params: { run_id: string; thread_id?: string }) => void;
                streamMode?: StreamMode[];
                streamSubgraphs?: TSubgraphs;
                streamResumable?: boolean;
                feedbackKeys?: string[];
            }
        ): TypedAsyncGenerator<TSubgraphs, TStateType, TUpdateType>;
        joinStream(
            threadId: string,
            runId: string,
            options?:
                | {
                      signal?: AbortSignal;
                      cancelOnDisconnect?: boolean;
                      lastEventId?: string;
                      streamMode?: StreamMode | StreamMode[];
                  }
                | AbortSignal
        ): AsyncGenerator<{ id?: string; event: StreamEvent; data: any }>;
        cancel(threadId: string, runId: string, wait?: boolean, action?: CancelAction): Promise<void>;
    };
}
