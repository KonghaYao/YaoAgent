import { ReadableCleanerPlugin } from "../ReadableCleaner.js";

/** 修复 a 标签下的 div 标签，导致 Markdown 换行的问题*/
export const aTagCleanPlugin: ReadableCleanerPlugin = {
    name: "aTagClean",
    beforeClean: (doc, cleaner) => {
        doc.querySelectorAll("a div").forEach((pTag) => {
            const spanTag = doc.createElement("span");
            spanTag.innerHTML = pTag.innerHTML;
            pTag.parentNode?.replaceChild(spanTag, pTag);
        });
    },
};
/** 删除 style 标签 */
export const DeleteStyleCleanPlugin: ReadableCleanerPlugin = {
    name: "deleteStyleTag",
    beforeClean: (doc, cleaner) => {
        doc.querySelectorAll("style").forEach((styleTag) => {
            styleTag.parentNode?.removeChild(styleTag);
        });
    },
};
