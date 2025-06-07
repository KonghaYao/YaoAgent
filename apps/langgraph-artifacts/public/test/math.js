import * as math from "mathjs";

// 计算表达式
console.log(math.evaluate("12.5 cm to inch")); // 输出: 4.921259842519685 inch

// 执行基本算术
console.log(math.add(2, 3)); // 输出: 5
console.log(math.multiply(4, 5)); // 输出: 20

// 使用常量
console.log(math.pi); // 输出: 3.141592653589793
console.log(math.e); // 输出: 2.718281828459045

// 矩阵操作
const a = math.matrix([
    [1, 2],
    [3, 4],
]);
const b = math.matrix([
    [5, 6],
    [7, 8],
]);
console.log(math.add(a, b).toArray()); // 输出: [[6, 8], [10, 12]]

// 单位转换
console.log(math.unit("100 cm").to("m").toString()); // 输出: 1 m
