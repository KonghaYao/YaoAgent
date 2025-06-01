import { DOMParser, Element } from "@b-fuze/deno-dom";

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

export { DOMParser };
