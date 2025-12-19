import { createUITool } from "@langgraph-js/sdk";
import { z } from "zod";
import { BarChart3, TrendingUp, PieChart, ScatterChart, AreaChart, Radar, Grid3x3, BarChart } from "lucide-react";
import {
    LineChart,
    Line,
    BarChart as RechartsBarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    ScatterChart as RechartsScatterChart,
    Scatter,
    AreaChart as RechartsAreaChart,
    Area,
    RadarChart as RechartsRadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar as RechartsRadar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
} from "recharts";

const VisualizeDataWithChartSchema = {
    title: z.string().describe("Chart title"),
    description: z.string().optional().describe("Optional chart description"),
    chart_type: z.enum(["line", "bar", "pie", "scatter", "area", "radar", "heatmap", "histogram"]).describe("Type of chart to render"),
    data: z.array(z.record(z.string(), z.any())).describe("Chart data points"),
    x_axis: z
        .object({
            label: z.string().describe("X-axis label"),
            field: z.string().describe("Data field for X-axis"),
        })
        .optional()
        .describe("X-axis configuration"),
    y_axis: z
        .object({
            label: z.string().describe("Y-axis label"),
            field: z.string().describe("Data field for Y-axis"),
        })
        .optional()
        .describe("Y-axis configuration"),
    options: z.record(z.string(), z.any()).optional().describe("Additional chart configuration options"),
};

const getChartIcon = (chartType: string) => {
    switch (chartType) {
        case "line":
            return TrendingUp;
        case "bar":
            return BarChart3;
        case "pie":
            return PieChart;
        case "scatter":
            return ScatterChart;
        case "area":
            return AreaChart;
        case "radar":
            return Radar;
        case "heatmap":
            return Grid3x3;
        case "histogram":
            return BarChart;
        default:
            return BarChart3;
    }
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

const renderChart = (chartType: string, data: Record<string, any>[], xAxis?: { label: string; field: string }, yAxis?: { label: string; field: string }, options?: Record<string, any>) => {
    if (!data || data.length === 0) {
        return <div className="text-sm text-gray-500 p-8 text-center">No data available</div>;
    }

    const commonProps = {
        data,
        margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
        case "line":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxis?.field || "name"} label={{ value: xAxis?.label, position: "insideBottom", offset: -5 }} />
                        <YAxis label={{ value: yAxis?.label, angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        {yAxis?.field && <Line type="monotone" dataKey={yAxis.field} stroke={COLORS[0]} strokeWidth={2} />}
                    </LineChart>
                </ResponsiveContainer>
            );

        case "bar":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxis?.field || "name"} label={{ value: xAxis?.label, position: "insideBottom", offset: -5 }} />
                        <YAxis label={{ value: yAxis?.label, angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        {yAxis?.field && <Bar dataKey={yAxis.field} fill={COLORS[0]} />}
                    </RechartsBarChart>
                </ResponsiveContainer>
            );

        case "pie":
            // Pie chart uses different data structure
            const pieData =
                xAxis?.field && yAxis?.field
                    ? data.map((item) => ({
                          name: item[xAxis.field],
                          value: item[yAxis.field],
                      }))
                    : data;
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <RechartsPieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(props: any) => {
                                const { name, percent } = props;
                                return `${name}: ${((percent as number) * 100).toFixed(0)}%`;
                            }}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey={yAxis?.field || "value"}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </RechartsPieChart>
                </ResponsiveContainer>
            );

        case "scatter":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <RechartsScatterChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey={xAxis?.field || "x"} name={xAxis?.label || "X"} />
                        <YAxis type="number" dataKey={yAxis?.field || "y"} name={yAxis?.label || "Y"} />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter dataKey={yAxis?.field || "y"} fill={COLORS[0]} />
                    </RechartsScatterChart>
                </ResponsiveContainer>
            );

        case "area":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <RechartsAreaChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxis?.field || "name"} label={{ value: xAxis?.label, position: "insideBottom", offset: -5 }} />
                        <YAxis label={{ value: yAxis?.label, angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        {yAxis?.field && <Area type="monotone" dataKey={yAxis.field} stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} />}
                    </RechartsAreaChart>
                </ResponsiveContainer>
            );

        case "radar":
            const radarData = data.map((item) => {
                const result: Record<string, any> = {};
                if (xAxis?.field) {
                    result[xAxis.field] = item[xAxis.field];
                }
                if (yAxis?.field) {
                    result[yAxis.field] = item[yAxis.field];
                }
                // Include all numeric fields
                Object.keys(item).forEach((key) => {
                    if (typeof item[key] === "number" && key !== xAxis?.field && key !== yAxis?.field) {
                        result[key] = item[key];
                    }
                });
                return result;
            });
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <RechartsRadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey={xAxis?.field || "name"} />
                        <PolarRadiusAxis />
                        <RechartsRadar name={yAxis?.label || "Value"} dataKey={yAxis?.field || "value"} stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.6} />
                        <Tooltip />
                        <Legend />
                    </RechartsRadarChart>
                </ResponsiveContainer>
            );

        case "heatmap":
            // Heatmap is not directly supported by recharts, use a composed chart as approximation
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxis?.field || "name"} label={{ value: xAxis?.label, position: "insideBottom", offset: -5 }} />
                        <YAxis label={{ value: yAxis?.label, angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        {yAxis?.field && (
                            <Bar dataKey={yAxis.field} fill={COLORS[0]} radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            );

        case "histogram":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <RechartsBarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxis?.field || "name"} label={{ value: xAxis?.label, position: "insideBottom", offset: -5 }} />
                        <YAxis label={{ value: yAxis?.label, angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        {yAxis?.field && <Bar dataKey={yAxis.field} fill={COLORS[0]} />}
                    </RechartsBarChart>
                </ResponsiveContainer>
            );

        default:
            return <div className="text-sm text-gray-500 p-8 text-center">Unsupported chart type: {chartType}</div>;
    }
};

export const visualize_data_with_chart = createUITool({
    name: "visualize_data_with_chart",
    description: "Generate a dynamic chart for data visualization and user review.",
    parameters: VisualizeDataWithChartSchema,
    onlyRender: true,
    render(tool) {
        const data = tool.getInputRepaired();
        const ChartIcon = getChartIcon(data.chart_type || "line");

        return (
            <div className="w-[70%] my-1 border border-gray-200 bg-white shadow-none rounded-xl overflow-hidden">
                <div className="pb-2 p-3 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <ChartIcon className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-900">{data.title}</h3>
                    </div>
                </div>
                <div className="p-4">
                    {data.description && <div className="text-sm text-gray-600 mb-4">{data.description}</div>}
                    <div className="w-full">{renderChart(data.chart_type || "line", (data.data || []) as Record<string, any>[], data.x_axis, data.y_axis, data.options)}</div>
                </div>
            </div>
        );
    },
});
