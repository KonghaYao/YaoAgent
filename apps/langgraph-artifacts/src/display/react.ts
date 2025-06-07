import { ArtifactDisplay } from "./Display.js";

export class ReactDisplay extends ArtifactDisplay {
    shouldRun(code: string) {
        // 作为最后垫底的实现方式
        return true;
    }
    private wrapper(url: string) {
        return this.transformCode(`
import React from "react";
import ReactDOM from "react-dom";
import 'unocss-browser';
import * as m from '${url}'

const App = m.default || m.App || Object.values(m)[0];
if(App) {
    ReactDOM.createRoot(document.getElementById("root")!).render(<App></App>);
}
    `).code;
    }
    async run(code: string) {
        this.injectImportMap(this.importMap);
        const mainCode = this.createESMJsURL(this.transformCode(code).code);
        return await this.runESMCode(this.wrapper(mainCode));
    }
}
