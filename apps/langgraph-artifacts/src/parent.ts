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
