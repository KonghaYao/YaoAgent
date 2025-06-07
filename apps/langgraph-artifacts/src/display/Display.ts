import { defaultImportMap } from "./importmap.js";
import { transformCode } from "../transform.js";

export abstract class ArtifactDisplay {
    transformCode = transformCode;
    urls: string[] = [];
    importMap: any = defaultImportMap;
    injectImportMap(importMap: any) {
        const script = document.createElement("script");
        script.type = "importmap";
        script.textContent = JSON.stringify(importMap);
        document.head.appendChild(script);
    }
    shouldRun(code: string, filename: string, filetype: string) {
        return true;
    }
    async runESMCode(code: string) {
        const url = this.createESMJsURL(code);
        return await import(url);
    }
    createESMJsURL(code: string) {
        const file = new File([code], "index.js", { type: "text/javascript" });
        const url = URL.createObjectURL(file);
        this.urls.push(url);
        return url;
    }
    destroy() {
        this.urls.forEach((url) => URL.revokeObjectURL(url));
    }
    abstract run(code: string): Promise<void>;
}
