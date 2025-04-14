import React from "react";
import * as d3 from "d3";

const Trendline = ({
  chartArea,
  parsedData,
  xScale,
  yScale,
  width,
  height,
}) => {
  // Create a group for the trendline with clip path
  const trendlineGroup = chartArea
    .append("g")
    .attr("class", "trendline-group")
    .attr("clip-path", "url(#clip)");

  // Initial trendline path with increased thickness (3px instead of 2px)
  const trendlinePath = trendlineGroup
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "green") // Forest green color
    .attr("stroke-width", 3) // Increased from 2 to 3 for better visibility
    .attr("stroke-dasharray", "5,5") // Dashed line
    .attr("class", "trendline");

  // Add legend for trendline
  const addTrendlineLegend = (svg) => {
    const legendEntry = svg
      .select("g.chart-legend")
      .append("g")
      .attr("class", "trendline-legend")
      .attr("transform", "translate(0, 20)");

    // Trendline legend item - also update thickness here to match
    legendEntry
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 20)
      .attr("y2", 0)
      .attr("stroke", "green")
      .attr("stroke-width", 3) // Increased from 2 to 3 for consistency
      .attr("stroke-dasharray", "5,5");

    legendEntry
      .append("text")
      .attr("x", 25)
      .attr("y", 4)
      .text("Linear Trend")
      .style("font-size", "18px");
  };

  // Function to calculate R-squared for trendline
  const calculateR2 = (actual, predicted) => {
    if (actual.length < 2) return 0;

    const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
    const totalSS = actual.reduce((a, b) => a + Math.pow(b - mean, 2), 0);

    // Handle edge case where all values are the same
    if (totalSS === 0) return 0;

    const residualSS = actual.reduce(
      (a, b, i) => a + Math.pow(b - predicted[i], 2),
      0
    );
    return 1 - residualSS / totalSS;
  };

  // Function to calculate and update the trendline
  const updateTrendline = (currentXScale) => {
    // Filter visible data based on current x domain
    const xDomain = currentXScale.domain();
    const visibleData = parsedData.filter(
      (d) => d.date >= xDomain[0] && d.date <= xDomain[1]
    );

    if (visibleData.length < 2) {
      // Clear the trendline and info if not enough data points
      trendlinePath.attr("d", null);
      chartArea.select(".trendline-info-group").remove();
      return;
    }

    // Calculate linear regression
    const xSeries = visibleData.map((d, i) => i);
    const ySeries = visibleData.map((d) => d.value);

    // Simple linear regression
    const n = xSeries.length;
    const xSum = xSeries.reduce((a, b) => a + b, 0);
    const ySum = ySeries.reduce((a, b) => a + b, 0);
    const xySum = xSeries.reduce((a, b, i) => a + b * ySeries[i], 0);
    const x2Sum = xSeries.reduce((a, b) => a + b * b, 0);

    const denominator = n * x2Sum - xSum * xSum;

    // Handle edge case where there's no variation in x
    if (denominator === 0) {
      trendlinePath.attr("d", null);
      chartArea.select(".trendline-info-group").remove();
      return;
    }

    const slope = (n * xySum - xSum * ySum) / denominator;
    const intercept = (ySum - slope * xSum) / n;

    // Create trendline data points
    const trendData = visibleData.map((d, i) => ({
      date: d.date,
      value: intercept + slope * i,
    }));

    // Update trendline
    const trendLine = d3
      .line()
      .x((d) => currentXScale(d.date))
      .y((d) => yScale(d.value));

    trendlinePath.datum(trendData).attr("d", trendLine);

    // Remove previous equation
    chartArea.select(".trendline-info-group").remove();

    const r2 = calculateR2(
      ySeries,
      trendData.map((d) => d.value)
    );
    const equation = `y = ${slope.toFixed(4)}x + ${intercept.toFixed(
      2
    )} (R² = ${r2.toFixed(3)})`;

    // Create a group for the equation and background
    const equationGroup = chartArea
      .append("g")
      .attr("class", "trendline-info-group")
      .attr("transform", `translate( 300, 10)`);

    // Calculate text width and height for background sizing
    // Create temporary text element to measure
    const tempText = chartArea
      .append("text")
      .attr("font-size", "20px")
      .text(equation);

    const textBBox = tempText.node().getBBox();
    tempText.remove();

    const padding = 8;
    // Add white background rectangle with padding
    equationGroup
      .append("rect")
      .attr("x", -textBBox.width - padding) // Add padding
      .attr("y", -textBBox.height / 2 - padding / 2) // Adjust for text position
      .attr("width", textBBox.width + padding * 2) // Add padding
      .attr("height", textBBox.height + padding) // Add padding
      .attr("fill", "white")
      .attr("stroke", "lightgray")
      .attr("stroke-width", 1)
      .attr("rx", 4) // Rounded corners
      .attr("ry", 4);

    // Add the equation text on top of the background
    equationGroup
      .append("text")
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle") // This helps with vertical centering
      .attr("font-size", "20px")
      .attr("fill", "green")
      .text(equation);
  };

  // Expose a cleanup method to remove trendline elements
  const removeTrendline = () => {
    trendlineGroup.remove();
    chartArea.select(".trendline-info-group").remove();
    d3.select(".trendline-legend").remove();
  };

  // Return public methods to be used by parent component
  return {
    updateTrendline,
    addTrendlineLegend,
    removeTrendline,
  };
};

export default Trendline;
