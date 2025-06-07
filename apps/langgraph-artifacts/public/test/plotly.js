// Import Plotly from a CDN that provides ESM builds.
// 'plotly.js-dist-min' is a good choice for a smaller bundle
// that includes most common chart types.
// The '+esm' suffix ensures it's loaded as an ES Module.
import Plotly from "plotly";

// Define your data traces
const trace1 = {
    x: [1, 2, 3, 4],
    y: [10, 15, 13, 17],
    mode: "markers",
    type: "scatter",
    name: "Trace 1",
};

const trace2 = {
    x: [1, 2, 3, 4],
    y: [16, 5, 11, 9],
    mode: "lines+markers",
    type: "scatter",
    name: "Trace 2",
};

const data = [trace1, trace2];

// Define the layout
const layout = {
    title: "My Scatter Plot with Plotly.js ESM",
    xaxis: {
        title: "X-axis Label",
    },
    yaxis: {
        title: "Y-axis Label",
    },
};

// Define configuration options (optional)
const config = {
    responsive: true, // Makes the plot responsive to window resizing
    displayModeBar: true, // Shows the mode bar with download/zoom options
};

// Get the div where the plot will be drawn
const plotDiv = document.getElementById("root");

// Create the plot
Plotly.newPlot(plotDiv, data, layout, config);

// You can also add dynamic updates or event listeners here if needed
// For example, to add a click event:
plotDiv.on("plotly_click", function (eventData) {
    if (eventData.points && eventData.points.length > 0) {
        const point = eventData.points[0];
        console.log(`Clicked on point: x=${point.x}, y=${point.y}, trace=${point.curveNumber}`);
    }
});

console.log("Plotly.js loaded and plot created via ESM!");
