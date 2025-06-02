import { ReadableCleanerPlugin } from "../ReadableCleaner.js";

/** 修复 a 标签下的 div 标签，导致 Markdown 换行的问题*/
export const aTagCleanPlugin: ReadableCleanerPlugin = {
    name: "aTagClean",
    beforeClean: (doc, cleaner) => {
        console.log([...doc.querySelectorAll("a p")]);
        doc.querySelectorAll("a div").forEach((pTag) => {
            const spanTag = doc.createElement("span");
            spanTag.innerHTML = pTag.innerHTML;
            pTag.parentNode?.replaceChild(spanTag, pTag);
        });
    },
};
