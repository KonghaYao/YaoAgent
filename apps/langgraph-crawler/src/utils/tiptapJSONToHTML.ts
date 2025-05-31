import { generateHTML } from "@tiptap/html";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Link from "@tiptap/extension-link";
import CodeBlock from "@tiptap/extension-code-block";
import Code from "@tiptap/extension-code";
// pnpm i @tiptap/extension-heading @tiptap/extension-blockquote @tiptap/extension-list-item @tiptap/extension-ordered-list @tiptap/extension-image
import Image from "@tiptap/extension-image";
import Heading from "@tiptap/extension-heading";
import Blockquote from "@tiptap/extension-blockquote";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import TextStyle from "@tiptap/extension-text-style";
import { Mark, mergeAttributes, Node } from "@tiptap/core";

const ignoreBase: any = (tagName: string) => ({
    name: "color",
    tagName: "span",
    addAttributes() {
        return {
            color: {
                default: null,
            },
            name: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: tagName,
            },
        ];
    },

    // @ts-ignore
    renderHTML({ HTMLAttributes }) {
        return [tagName, HTMLAttributes, 0];
    },
});

export const ALink = Node.create({
    name: "link",

    priority: 700,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    group: "block",

    content: "inline*",

    parseHTML() {
        return [{ tag: "a" }];
    },

    renderHTML({ HTMLAttributes }) {
        return ["a", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
});
export const CodeInline = Node.create({
    name: "codeinline",

    priority: 700,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    group: "block",

    content: "inline*",

    parseHTML() {
        return [{ tag: "code" }];
    },

    renderHTML({ HTMLAttributes }) {
        return ["code", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },
});

export const tiptapJSONToHTML = (json: any) => {
    // ListItem.name = "listitem";
    return generateHTML(json, [
        ALink,
        Mark.create(ignoreBase("span")),
        Mark.create({
            ...ignoreBase("strong"),
            name: "strong",
        }),
        Mark.create({
            ...ignoreBase("span"),
            name: "italic",
        }),
        CodeInline,
        Mark.create({
            ...ignoreBase("em"),
            name: "em",
        }),
        CodeBlock,
        // Link,
        Document,
        Paragraph,
        Text,
        Bold,
        Code,
        Image,
        Heading,
        Blockquote,
        ListItem,
        OrderedList,
        BulletList,
        // Color,
        TextStyle,
    ]);
};
