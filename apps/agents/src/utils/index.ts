import { Annotation } from "@langchain/langgraph";

export const createDefaultAnnotation = <T>(default_value: () => T) =>
    Annotation<T>({
        reducer: (a) => a,
        default: default_value,
    });
