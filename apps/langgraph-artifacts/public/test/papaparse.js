import Papa from "papaparse";

// 模拟一个 CSV 字符串
const csvData = `Name,Age,City
Alice,30,New York
Bob,24,London
Charlie,35,Paris`;

// 使用 Papa Parse 解析 CSV 字符串
Papa.parse(csvData, {
    header: true, // 将第一行作为列名
    dynamicTyping: true, // 尝试将字符串转换为数字或布尔值
    complete: function (results) {
        // 解析完成后，这个回调函数会被调用
        console.log("解析结果:", results);

        const outputDiv = document.getElementById("output");
        if (outputDiv) {
            // 将解析结果格式化为 JSON 字符串并显示在页面上
            outputDiv.textContent = JSON.stringify(results.data, null, 2);
        }
    },
    error: function (err, file) {
        // 如果解析过程中发生错误
        console.error("解析错误:", err, file);
        const outputDiv = document.getElementById("output");
        if (outputDiv) {
            outputDiv.textContent = `解析错误: ${err.message}`;
        }
    },
});
