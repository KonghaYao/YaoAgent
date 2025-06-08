import { Annotation, AnnotationRoot, StateDefinition } from "@langchain/langgraph";
/**
 * create state for langgraph, like python version
 * @example
 * export const GraphState = createState(createReactAgentAnnotation(), ModelState, SwarmState).build({
 *   current_plan: createDefaultAnnotation<Plan | null>(() => null),
 *   title: createDefaultAnnotation<string>(() => ""),
 *});
 */
export const createState = <T extends readonly AnnotationRoot<any>[]>(...parents: T) => {
    return {
        build: <D extends StateDefinition>(state: D = {} as D) => {
            type MergedState = UnionToIntersection<
                {
                    [K in keyof T]: T[K] extends AnnotationRoot<infer D> ? D : never;
                }[number]
            > &
                D;
            return Annotation.Root<MergedState>(Object.assign({}, ...parents.map((p) => p.spec), state));
        },
    };
};

// 辅助类型，用于将联合类型转换为交叉类型
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
/**
 * 创建一个默认值注解
 * @example
 * const state = createState().build({
 *   current_plan: createDefaultAnnotation<Plan | null>(() => null),
 * });
 */
export const createDefaultAnnotation = <T>(defaultValue: () => T) =>
    Annotation<T>({
        reducer: (_, a) => a,
        default: defaultValue,
    });
