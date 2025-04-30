import { Annotation } from "@langchain/langgraph";

export const createDefaultAnnotation = <T>(default_value: () => T) =>
    Annotation<T>({
        reducer: (_, a) => a,
        default: default_value,
    });
