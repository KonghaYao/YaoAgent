await new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/papaparse@5.5.3/papaparse.min.js";
    script.onload = resolve;
    document.head.appendChild(script);
});

export default globalThis.Papa;
