await new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/papaparse@5.5.3/papaparse.min.js";
    script.onload = resolve;
    document.head.appendChild(script);
});

export default globalThis.Papa;
