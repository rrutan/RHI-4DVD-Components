import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./Spectrogram.css"; // Import CSS file

const SpectrogramHeatmap = ({ spectrogramData }) => {
  const chartRef = useRef();
  const legendRef = useRef();

  useEffect(() => {
    console.log(spectrogramData);

    if (!spectrogramData) {
      console.error("invalid data format");
      return;
    }

    const margin = { top: 20, right: 30, bottom: 60, left: 60 },
      width = chartRef.current.clientWidth - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    d3.select(chartRef.current).select("svg").remove();

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const chartArea = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const { dates, frequencies, power } = spectrogramData;

    const parsedDates = dates.map((dateStr) => new Date(dateStr));

    // **X-Axis: Time**
    const x = d3.scaleTime().domain(d3.extent(parsedDates)).range([0, width]);

    // **Y-Axis: Frequency**
    const y = d3
      .scaleLinear()
      .domain([d3.min(frequencies), d3.max(frequencies)])
      .range([height, 0]);

    // Add X-Axis
    const xAxis = chartArea
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add Y-Axis
    const yAxis = chartArea.append("g").call(d3.axisLeft(y).ticks(10));

    // Add labels for X and Y axes
    svg
      .append("text")
      .attr(
        "transform",
        `translate(${width / 2 + margin.left},${height + margin.top + 40})`
      )
      .style("text-anchor", "middle")
      .text("Time");

    svg
      .append("text")
      .attr("transform", `rotate(-90)`)
      .attr("y", margin.left - 40)
      .attr("x", -(height / 2) - margin.top)
      .style("text-anchor", "middle")
      .text("Frequency (Hz)");

    // **Color Scale for Intensity (Color represents dB or Intensity)**
    const colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain([d3.min(power.flat()), d3.max(power.flat())]);

    // **Draw the Heatmap Cells (rectangles)**
    chartArea
      .selectAll("rect")
      .data(power.flat())
      .enter()
      .append("rect")
      .attr("x", (d, i) => (i % dates.length) * (width / dates.length))
      .attr(
        "y",
        (d, i) => Math.floor(i / dates.length) * (height / frequencies.length)
      )
      .attr("width", width / dates.length)
      .attr("height", height / frequencies.length)
      .style("fill", (d) => colorScale(d)) // Set the fill color based on intensity
      .style("stroke", "#fff")
      .style("stroke-width", 0.5);

    d3.select("#legend-container").selectAll("*").remove();

    // Set up the legend dimensions
    const legendWidth = 300; // Adjust based on your design
    const legendHeight = 20; // Height of the gradient
    const legendMargin = { top: 20, right: 20, bottom: 30, left: 20 }; // Adjust for spacing

    // Create an SVG container for the legend
    const legendSvg = d3
      .select("#legend-container") // Make sure this container exists in your HTML
      .append("svg")
      .attr("width", legendWidth + legendMargin.left + legendMargin.right)
      .attr("height", legendHeight + legendMargin.top + legendMargin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" + legendMargin.left + "," + legendMargin.top + ")"
      );

    // Create the color gradient rectangle
    legendSvg
      .append("defs")
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%")
      .selectAll("stop")
      .data(colorScale.ticks(10)) // Set the number of stops
      .enter()
      .append("stop")
      .attr("offset", (d, i, nodes) => (i / (nodes.length - 1)) * 100 + "%") // Spread stops equally
      .attr("stop-color", (d) => colorScale(d));

    // Create the rectangle to show the gradient
    legendSvg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#gradient)");

    // Add axis labels to show the range of values
    const xScaleLegend = d3
      .scaleLinear()
      .domain([d3.min(power.flat()), d3.max(power.flat())])
      .range([0, legendWidth]);

    const xAxisLegend = d3
      .axisBottom(xScaleLegend)
      .ticks(5) // Set the number of ticks
      .tickSize(6); // Add tick marks

    legendSvg
      .append("g")
      .attr("transform", "translate(0," + legendHeight + ")")
      .call(xAxisLegend); // Use xAxisLegend instead of xAxis

    // Add the label above the color bar legend
    legendSvg
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -10) // Position it above the color bar
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Intensity (dB)"); // Set the label text
  }, [spectrogramData]);

  return (
    <div className="chart-wrapper">
      <div className="chart-container" ref={chartRef}></div>
      <div id="legend-container">
        <svg ref={legendRef} /> {/* The SVG for the color legend */}
      </div>
    </div>
  );
};

export default SpectrogramHeatmap;
