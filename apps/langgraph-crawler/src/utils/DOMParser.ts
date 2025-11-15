import { DOMParser, Element, initParser } from "@b-fuze/deno-dom/wasm-noinit";

class DOMImplementation {
    constructor() {}
    isSetup = false;
    async setup() {
        if (this.isSetup) return this;
        await initParser();
        // 为 Element 类添加 getAttributeNode 方法的 polyfill
        Element.prototype.getAttributeNode = function (name: string) {
            const value = this.getAttribute(name);
            if (value === null) return null;
            return {
                name,
                value,
                specified: true,
                ownerElement: this,
            };
        };

        // 为 Element 类添加 setAttributeNode 方法的 polyfill
        Element.prototype.setAttributeNode = function (attr: { nodeName: string; name: string; value: string; parentNode: Element }) {
            if (!attr || typeof attr.name !== "string" || typeof attr.value !== "string") {
                throw new Error("Invalid attribute node");
            }
            const oldAttr = this.getAttributeNode(attr.name);
            this.setAttribute(attr.name, attr.value);
            return oldAttr;
        };
        this.isSetup = true;
        return this;
    }
}

// export { DOMParser };

export const getDocument = async (html: string, url: string = "http://localhost:8080") => {
    const parser = await new DOMImplementation().setup();
    const document = new DOMParser().parseFromString(html, "text/html");
    return document as unknown as Document;
};
