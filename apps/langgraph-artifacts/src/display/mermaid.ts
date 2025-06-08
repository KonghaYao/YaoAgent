import { ArtifactDisplay, ArtifactRunResult } from "./Display.js";

export class MermaidDisplay extends ArtifactDisplay {
    shouldRun(code: string, filename: string, filetype: string) {
        // 作为最后垫底的实现方式
        return filetype === "application/vnd.ant.mermaid";
    }
    private wrapper(code: string) {
        return this.transformCode(`
import mermaid from "mermaid";
mermaid.initialize({
    theme: "default",
    securityLevel: "loose",
    startOnLoad: false,
});

async function renderDiagram() {
    const diagramDefinition = \`${code}\`
    const { svg, bindFunctions } = await mermaid.render('playButton', diagramDefinition);
    document.getElementById('root').innerHTML = svg;
    if (bindFunctions) {
        bindFunctions(); // Important for interactive diagrams
    }
}

renderDiagram();`).code;
    }
    async run(code: string): Promise<ArtifactRunResult> {
        this.injectImportMap(this.importMap);
        const data = await this.runESMCode(this.wrapper(code));
        return {
            status: "success",
            data: JSON.stringify(data),
        };
    }
}
