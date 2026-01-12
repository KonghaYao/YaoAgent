import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtHeader,
    ChainOfThoughtImage,
    ChainOfThoughtSearchResult,
    ChainOfThoughtSearchResults,
    ChainOfThoughtStep,
} from "../../components/ai-elements/chain-of-thought";
import { RenderMessage } from "@langgraph-js/sdk";

export const Reasoning = (props: { reasoning_content: string; className?: string }) => {
    return (
        <ChainOfThought defaultOpen className={props.className}>
            <ChainOfThoughtHeader>思考内容</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
                <ChainOfThoughtStep label={(props.reasoning_content as string) || ""} status="complete" />
            </ChainOfThoughtContent>
        </ChainOfThought>
    );
};
