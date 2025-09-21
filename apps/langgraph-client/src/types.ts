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
export type TypedAsyncGenerator<
    TStreamMode extends StreamMode | StreamMode[] = [],
    TSubgraphs extends boolean = false,
    TStateType = unknown,
    TUpdateType = TStateType,
    TCustomType = unknown,
> = AsyncGenerator<
    | {
          values: ValuesStreamEvent<TStateType>;
          updates: UpdatesStreamEvent<TUpdateType>;
          custom: CustomStreamEvent<TCustomType>;
          debug: DebugStreamEvent;
          messages: MessagesStreamEvent;
          "messages-tuple": MessagesTupleStreamEvent;
          events: EventsStreamEvent;
      }[TStreamMode extends StreamMode[] ? TStreamMode[number] : TStreamMode]
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
        create<ValuesType = TStateType>(payload?: {
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
        }): Promise<Thread<ValuesType>>;
        search<ValuesType = TStateType>(query?: {
            metadata?: Metadata;
            limit?: number;
            offset?: number;
            status?: ThreadStatus;
            sortBy?: ThreadSortBy;
            sortOrder?: SortOrder;
        }): Promise<Thread<ValuesType>[]>;
        get<ValuesType = TStateType>(threadId: string): Promise<Thread<ValuesType>>;
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
        stream<TStreamMode extends StreamMode | StreamMode[] = StreamMode, TSubgraphs extends boolean = false>(
            threadId: null,
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
                signal?: AbortController["signal"];
                webhook?: string;
                onDisconnect?: DisconnectMode;
                afterSeconds?: number;
                ifNotExists?: "create" | "reject";
                command?: Command;
                onRunCreated?: (params: { run_id: string; thread_id?: string }) => void;
                streamMode?: TStreamMode;
                streamSubgraphs?: TSubgraphs;
                streamResumable?: boolean;
                feedbackKeys?: string[];
            }
        ): TypedAsyncGenerator<TStreamMode, TSubgraphs, TStateType, TUpdateType>;
        stream<TStreamMode extends StreamMode | StreamMode[] = StreamMode, TSubgraphs extends boolean = false>(
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
                streamMode?: TStreamMode;
                streamSubgraphs?: TSubgraphs;
                streamResumable?: boolean;
                feedbackKeys?: string[];
            }
        ): TypedAsyncGenerator<TStreamMode, TSubgraphs, TStateType, TUpdateType>;
        joinStream(
            threadId: string | undefined | null,
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
