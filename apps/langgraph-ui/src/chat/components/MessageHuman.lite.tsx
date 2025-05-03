import { For } from "@builder.io/mitosis";

export default function MessageHuman(props: { content: any }) {
    return (
        <div class="message human">
            <div class="message-content">
                <div class="message-text">{typeof props.content === "string" ? props.content : props.content.map((item: any) => item.text).join("")}</div>
            </div>
        </div>
    );
}
