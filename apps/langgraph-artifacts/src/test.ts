import { Entrypoint } from "./index.js";

const code = await fetch("/test-react.tsx").then((res) => res.text());
const entrypoint = new Entrypoint();
entrypoint.run(code, "test-react.tsx");
