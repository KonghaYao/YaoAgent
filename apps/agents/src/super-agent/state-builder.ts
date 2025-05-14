import { Annotation, AnnotationRoot, StateDefinition } from "@langchain/langgraph";

export const createState = <T extends readonly AnnotationRoot<any>[]>(...parents: T) => {
    type MergedState = UnionToIntersection<
        {
            [K in keyof T]: T[K] extends AnnotationRoot<infer D> ? D : never;
        }[number]
    > &
        StateDefinition;
    return {
        build: (state: StateDefinition) =>
            Annotation.Root<MergedState>(Object.assign({}, ...parents.map((p) => p.spec), state)),
    };
};

// 辅助类型，用于将联合类型转换为交叉类型
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
