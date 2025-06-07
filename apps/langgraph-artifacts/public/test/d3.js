// 从 D3.js CDN 导入所需的模块
// 这里我们只导入了常用的 d3-selection, d3-scale, d3-array, d3-axis
// 在实际项目中，你可能需要根据需要导入更多模块，或者安装 npm 包
import { select, scaleBand, scaleLinear, max, axisBottom, axisLeft } from "d3";

// 示例数据
const data = [
    { name: "A", value: 80 },
    { name: "B", value: 120 },
    { name: "C", value: 60 },
    { name: "D", value: 150 },
    { name: "E", value: 90 },
];

// 图表配置
const width = 600;
const height = 400;
const margin = { top: 30, right: 30, bottom: 60, left: 70 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// 创建 SVG 容器
const svg = select("#root").append("svg").attr("width", width).attr("height", height);

// 创建一个 g 元素，用于容纳图表内容，并应用边距
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

// 定义 X 轴比例尺
const xScale = scaleBand()
    .domain(data.map((d) => d.name)) // 使用数据的 name 属性作为域名
    .range([0, innerWidth])
    .padding(0.1);

// 定义 Y 轴比例尺
const yScale = scaleLinear()
    .domain([0, max(data, (d) => d.value)]) // 使用数据的 value 属性的最大值作为域名
    .range([innerHeight, 0]);

// 绘制条形
g.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.name))
    .attr("y", (d) => yScale(d.value))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => innerHeight - yScale(d.value));

// 绘制 X 轴
g.append("g").attr("class", "x-axis").attr("transform", `translate(0,${innerHeight})`).call(axisBottom(xScale));

// 绘制 Y 轴
g.append("g").attr("class", "y-axis").call(axisLeft(yScale));

// 添加 X 轴标签
g.append("text")
    .attr("class", "x-axis-label")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + margin.bottom / 2 + 10)
    .attr("text-anchor", "middle")
    .text("类别");

// 添加 Y 轴标签
g.append("text")
    .attr("class", "y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -innerHeight / 2)
    .attr("text-anchor", "middle")
    .text("值");

// 添加图表标题
svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("纯 ESM D3.js 条形图");
