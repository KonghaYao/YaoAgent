import { polyfillProcess } from "./polyfill.js";
import { transform } from "@rolldown/browser/experimental";
polyfillProcess();
export const transformCode = (code: string) => {
    return transform("index.tsx", code);
};
