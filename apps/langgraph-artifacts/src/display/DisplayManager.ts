import { ArtifactDisplay } from "./Display.js";

export class DisplayManager {
    displays: ArtifactDisplay[] = [];
    register(display: ArtifactDisplay | ArtifactDisplay[]) {
        if (Array.isArray(display)) {
            this.displays.push(...display);
        } else {
            this.displays.push(display);
        }
    }
    runCode(code: string, filename: string, filetype: string) {
        const display = this.displays.find((display) => display.shouldRun(code, filename, filetype));
        if (!display) {
            throw new Error(`Display not found`);
        }
        return display.run(code);
    }
}
