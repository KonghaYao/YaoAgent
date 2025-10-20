/**@ts-ignore */
const baseURL = import.meta.env.MODE === "production" ? "./cdn" : "./dist/cdn";
const shadcnURL = baseURL + "/shadcdn.js";

export const defaultImportMap = {
    imports: {
        "@/components/ai-elements": baseURL + "/ai-sdk.js",
        "@/components/ui": shadcnURL,
        react: baseURL + "/react.js",
        "react/jsx-runtime": baseURL + "/react.js",
        "react-dom": baseURL + "/react.js",
        "framer-motion": baseURL + "/react.js",
        "react-dom/client": baseURL + "/react.js",
        motion: baseURL + "/react.js",
        lodash: baseURL + "/lodash.js",
        // mathjs: "https://esm.sh/mathjs@14.5.2/es2022/mathjs.mjs",
        // "prop-types": "https://unpkg.com/prop-types@15.8.1/prop-types.min.js",
        // three: "https://unpkg.com/three@0.177.0/build/three.module.js",
        // p5: "https://unpkg.com/p5@2.0.3/lib/p5.esm.min.js",
        // "@react-three/fiber": "https://unpkg.com/@react-three/fiber@9.1.2/dist/react-three-fiber.esm.js",
        // "react-use-measure": "https://unpkg.com/react-use-measure@2.1.7/dist/index.js",
        // "its-fine": "https://unpkg.com/its-fine@2.0.0/dist/index.js",
        // scheduler: "https://esm.sh/scheduler@0.23.2",
        // "suspend-react": "https://unpkg.com/suspend-react@0.1.3/index.js",
        // "react-reconciler": "https://esm.sh/react-reconciler@0.29.2",
        // "react-reconciler/constants": "https://esm.sh/react-reconciler@0.29.2/constants",
        // zustand: "https://esm.sh/zustand@4.5.7?deps=react@18.3.1",
        // "zustand/traditional": "https://esm.sh/zustand@4.5.7/traditional?deps=react@18.3.1",

        tone: baseURL + "/tone.js",
        // "chart.js": "./cdn/chart.js",
        xlsx: baseURL + "/xlsx.js",
        papaparse: baseURL + "/papaparse.js",
        // d3: "./cdn/d3.js",
        // mermaid: "./cdn/mermaid.js",
        // plotly: "./cdn/plotly.js",
        // "plotly.js-dist-min": "./cdn/plotly.js",
        // recharts: "./cdn/recharts.js",
        "unocss-browser": baseURL + "/unocss.js",
        "lucide-react": baseURL + "/lucide.js",
    },
};
