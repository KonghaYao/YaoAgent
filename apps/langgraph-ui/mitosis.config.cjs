/**
 * @type {import('@builder.io/mitosis').MitosisConfig}
 */
module.exports = {
    files: "src/**/*",
    targets: ["react"],
    dest: "dist",
    commonOptions: {
        typescript: true,
    },
    parserOptions: {
        jsx: {
            tsConfigFilePath: "./src/tsconfig.json",
        },
    },
    typescript: true,
    options: {
        react: {
            stylesType: "style-tag",
        },
    },
};
