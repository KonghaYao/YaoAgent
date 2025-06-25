/**
 * 分析源代码文件中的 import 依赖
 * @param sourceCode 源代码字符串
 * @returns 依赖名称数组
 */
export function analyzeImports(sourceCode: string): string[] {
    const dependencies = new Set<string>();

    // 正则表达式匹配各种 import 语句
    const importPatterns = [
        // import 'module' 或 import "module"
        /import\s+['"`]([^'"`]+)['"`]/g,

        // import { ... } from 'module' 或 import defaultExport from 'module'
        /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"`]([^'"`]+)['"`]/g,

        // require('module') 或 require("module")
        /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,

        // 动态 import('module')
        /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    ];

    // 遍历所有正则模式
    importPatterns.forEach((pattern) => {
        let match;
        while ((match = pattern.exec(sourceCode)) !== null) {
            const moduleName = match[1];
            if (moduleName && !isRelativeImport(moduleName)) {
                dependencies.add(moduleName);
            }
        }
    });

    return Array.from(dependencies);
}

/**
 * 判断是否为相对路径导入
 * @param moduleName 模块名称
 * @returns 是否为相对路径
 */
function isRelativeImport(moduleName: string): boolean {
    return moduleName.startsWith("./") || moduleName.startsWith("../") || moduleName.startsWith("/");
}
