export const polyfillProcess = () => {
    /** @ts-ignore */
    globalThis.process = {
        cwd: () => "/app",
        env: {},
        version: "1.0.0",
        platform: "browser",
        arch: "browser",
        release: "1.0.0",
        argv: [],
    };
};
