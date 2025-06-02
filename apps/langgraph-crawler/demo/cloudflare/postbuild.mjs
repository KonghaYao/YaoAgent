import fs from "fs";

const indexJs = fs.readFileSync("./dist/index.js", "utf-8");

const newIndexJs = indexJs.replace("\nawait init();", "\ninit();");

fs.writeFileSync("./dist/index.js", newIndexJs);
