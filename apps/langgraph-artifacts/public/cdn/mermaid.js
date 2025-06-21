await new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/mermaid@11.6.0/dist/mermaid.min.js";
    script.onload = resolve;
    document.head.appendChild(script);
    console.log("mermaid loaded");
});

export default globalThis.mermaid;
