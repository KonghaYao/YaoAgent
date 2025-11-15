import { ReadableCleanerPlugin } from "../ReadableCleaner.js";

export const npmPlugin: ReadableCleanerPlugin = {
    name: "npmjs",
    beforeClean: (doc, cleaner) => {
        if (cleaner.originUrl.includes("npmjs.com/package")) {
            const codeBlocks = doc.querySelectorAll("div.highlight");
            codeBlocks.forEach((i) => {
                const lang = [...i.classList].find((name) => name.startsWith("highlight-source-"))?.replace("highlight-source-", "");
                i.innerHTML = `<pre class='language language-content'><code class="language-${lang?.trim()}">${i.textContent}</code></pre>`;
            });
        }
    },
};
