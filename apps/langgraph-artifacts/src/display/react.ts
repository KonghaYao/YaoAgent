import { analyzeImports } from "../utils/analyzeImports.js";
import { ArtifactDisplay, ArtifactRunResult } from "./Display.js";

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
    async run(code: string): Promise<ArtifactRunResult> {
        const imports = analyzeImports(code);
        const importMap = {
            imports: {
                ...Object.fromEntries(
                    imports.map((i) => {
                        if (i.startsWith("@/components/ui/")) {
                            return [i, this.importMap.imports["@/components/ui"]];
                        }
                        if (i.startsWith("@/components/ai-elements/")) {
                            return [i, this.importMap.imports["@/components/ai-elements"]];
                        }
                        return [i, "https://esm.sh/" + i];
                    })
                ),
                ...this.importMap.imports,
            },
        };
        console.log(importMap);
        this.injectImportMap(importMap);
        const { code: compiledCode, errors } = this.transformCode(code);
        if (!compiledCode) {
            console.error(errors);
            return {
                status: "error",
                errors,
            };
        }
        const mainCode = this.createESMJsURL(compiledCode);
        const data = await this.runESMCode(this.wrapper(mainCode));
        return {
            status: "success",
            data: JSON.stringify(data),
        };
    }
}
