# @langgraph-js/artifacts

- [ ] react
- [ ] import css file

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
    </head>
    <body>
        <iframe src="./index.html" id="iframe"></iframe>
    </body>
    <script type="module">
        import { getIframeAPI } from "./src/parent.js";
        const iframe = document.getElementById("iframe");
        const iframeApi = await getIframeAPI(iframe);
        const code = await fetch("/test-react.tsx").then((res) => res.text());
        await iframeApi.run(code, "test-react.tsx");
        console.log("done");
    </script>
</html>
```

src/parent.js

```ts
import { wrap, windowEndpoint } from "comlink";

export const getIframeAPI = async (iframe: HTMLIFrameElement) => {
    const iframeApi = wrap(windowEndpoint(iframe.contentWindow!));

    // 5 秒内，每 50 ms 检测一次 init 函数，使用 Array()
    const index = await Promise.race(
        Array(100)
            .fill(0)
            .map((_, index) => {
                return new Promise((resolve) => {
                    setTimeout(async () => {
                        /* @ts-ignore */
                        if (await iframeApi.init()) {
                            resolve(index);
                        }
                    }, 50 * index);
                });
            })
    );

    return iframeApi;
};
```
