import { DisplayManager } from "./display/DisplayManager.js";
import { ReactDisplay } from "./display/react.js";

export class Entrypoint {
    run(code: string, filename: string) {
        const displayManager = new DisplayManager();
        displayManager.register([new ReactDisplay()]);
        displayManager.runCode(code);
    }
}
import { expose, windowEndpoint } from "comlink";

// 暴露给父页面的对象
const iframeApi = {
    run: (code: string, filename: string) => {
        const displayManager = new DisplayManager();
        displayManager.register([new ReactDisplay()]);
        displayManager.runCode(code);
    },
    /** 初始化时，根据这个判断是否初始化完成 */
    init() {
        return true;
    },
};

expose(iframeApi, windowEndpoint(self.parent));
