import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import "../TS/TimeSeriesChart.css";

const Histogram = ({ data }) => {
  const [numBins, setNumBins] = useState(20); // State for number of bins (initial value 20)
  const chartRef = useRef();

  // Update the number of bins when the slider changes
  const handleBinChange = (event) => {
    const newNumBins = Number(event.target.value);
    setNumBins(newNumBins); // Update numBins state
  };

  useEffect(() => {
    if (!data || !data.values || data.values.length === 0) return;

    const margin = { top: 10, right: 30, bottom: 80, left: 60 },
      width = chartRef.current.clientWidth - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    // Remove existing SVG elements
    d3.select(chartRef.current).select("svg").remove();

    // Create SVG element
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const chartArea = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale (Linear scale for data values)
    const x = d3
      .scaleLinear()
      .domain([d3.min(data.values), d3.max(data.values)])
      .range([0, width]);

    // Create bins using d3.histogram and x.ticks(numBins)
    const bins = d3.histogram().domain(x.domain()).thresholds(x.ticks(numBins))(
      data.values
    ); // Use x.ticks(numBins)

    // Y Scale (Linear scale for frequencies of bins)
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length)])
      .range([height, 0]);

    // X Axis
    const xAxis = chartArea
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10))
      .selectAll("text")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start");

    // Y Axis
    const yAxis = chartArea.append("g").call(d3.axisLeft(y));

    // Add X Axis Title
    svg
      .append("text")
      .attr(
        "transform",
        `translate(${width / 2 + margin.left}, ${height + margin.top + 40})`
      )
      .style("text-anchor", "middle")
      .text("Temperature (°C)");

    // Add Y Axis Title
    svg
      .append("text")
      .attr(
        "transform",
        `translate(${margin.left - 40}, ${height / 2 + margin.top}) rotate(-90)`
      )
      .style("text-anchor", "middle")
      .text("Counts");

    // Add Bars for the histogram
    chartArea
      .selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.x0))
      .attr("y", (d) => y(d.length))
      .attr("width", (d) => Math.max(1, x(d.x1) - x(d.x0) - 1)) // Prevent overlap
      .attr("height", (d) => height - y(d.length))
      .attr("fill", "#2ecc71");
  }, [data, numBins]); // Re-run useEffect when numBins changes

  return (
    <div className="chart-container">
      {/* Slider to control the number of bins */}
      <div>
        <label htmlFor="nBin">Number of Bins: </label>
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={numBins} // Bind the slider value to numBins state
          onChange={handleBinChange} // Trigger change on slider move
          id="nBin"
        />
        <span>{numBins}</span> {/* Display the current number of bins */}
      </div>
      <div ref={chartRef}></div>
    </div>
  );
};

export default Histogram;
