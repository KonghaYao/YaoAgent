// main.js
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

// 注册你需要的组件
// Chart.js 是模块化的，你需要显式地注册你将使用的所有组件
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const parent = document.getElementById("root");
const canvas = document.createElement("canvas");
parent.appendChild(canvas);
const ctx = canvas.getContext("2d");

new Chart(ctx, {
    type: "bar", // 图表类型，这里是柱状图
    data: {
        labels: ["一月", "二月", "三月", "四月", "五月", "六月"],
        datasets: [
            {
                label: "销售额",
                data: [65, 59, 80, 81, 56, 55],
                backgroundColor: ["rgba(255, 99, 132, 0.2)", "rgba(54, 162, 235, 0.2)", "rgba(255, 206, 86, 0.2)", "rgba(75, 192, 192, 0.2)", "rgba(153, 102, 255, 0.2)", "rgba(255, 159, 64, 0.2)"],
                borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)", "rgba(75, 192, 192, 1)", "rgba(153, 102, 255, 1)", "rgba(255, 159, 64, 1)"],
                borderWidth: 1,
            },
        ],
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
        plugins: {
            tooltip: {
                // 启用 Tooltip 插件
                // ... 可以自定义 Tooltip 选项
            },
            legend: {
                // 启用 Legend 插件
                display: true,
                position: "top",
            },
        },
    },
});
