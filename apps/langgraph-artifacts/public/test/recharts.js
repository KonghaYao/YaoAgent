import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// 示例数据
const data = [
    { name: "一月", uv: 4000, pv: 2400, amt: 2400 },
    { name: "二月", uv: 3000, pv: 1398, amt: 2210 },
    { name: "三月", uv: 2000, pv: 9800, amt: 2290 },
    { name: "四月", uv: 2780, pv: 3908, amt: 2000 },
    { name: "五月", uv: 1890, pv: 4800, amt: 2181 },
    { name: "六月", uv: 2390, pv: 3800, amt: 2500 },
    { name: "七月", uv: 3490, pv: 4300, amt: 2100 },
];

const SimpleBarChart = () => {
    return (
        <div style={{ width: "100%", height: 300 }}>
            {/* ResponsiveContainer 让图表在不同尺寸下自适应 */}
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    {/* CartesianGrid 用于显示网格线 */}
                    <CartesianGrid strokeDasharray="3 3" />
                    {/* XAxis 用于显示 x 轴的数据，dataKey 指定了数据中的哪个字段作为 x 轴的标签 */}
                    <XAxis dataKey="name" />
                    {/* YAxis 用于显示 y 轴的数据 */}
                    <YAxis />
                    {/* Tooltip 鼠标悬停时显示数据详情 */}
                    <Tooltip />
                    {/* Legend 用于显示图例，uv 和 pv 是 Bar 的 dataKey */}
                    <Legend />
                    {/* Bar 组件代表柱状图的柱子，dataKey 对应数据中的字段，fill 设置颜色 */}
                    <Bar dataKey="pv" fill="#8884d8" name="页面访问量" />
                    <Bar dataKey="uv" fill="#82ca9d" name="独立访客" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SimpleBarChart;
