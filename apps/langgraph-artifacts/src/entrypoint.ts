import { DisplayManager } from "./display/DisplayManager.js";
import { ReactDisplay } from "./display/react.js";

export class Entrypoint {
    run(code: string, filename: string) {
        const displayManager = new DisplayManager();
        displayManager.register([new ReactDisplay()]);
        displayManager.runCode(code);
    }
}
