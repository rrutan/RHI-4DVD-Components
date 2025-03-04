import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import FFT from "fft.js";
import "../TS/TimeSeriesChart.css"; // Import CSS file

const PeriodogramChart = ({ data }) => {
  const chartRef = useRef();

  useEffect(() => {
    if (!data || !data.dates || !data.values) return;

    let values = data.values;
    const N = values.length;

    // function to find next power of 2 greater or equal to length of values
    function nextPowerOfTwo(n) {
      return Math.pow(2, Math.ceil(Math.log2(n)));
    }
    function padDataPowerOfTwo(values) {
      const nextPower = nextPowerOfTwo(values.length);
      const paddedData = new Array(nextPower).fill(0);
      for (let i = 0; i < values.length; i++) {
        paddedData[i] = values[i];
      }
      return paddedData;
    }

    values = padDataPowerOfTwo(values);

    // Function to compute the periodogram
    function computePeriodogram(values) {
      const fft = new FFT(values.length);
      const out = fft.createComplexArray();
      const spectrum = [];

      fft.realTransform(out, values);
      fft.completeSpectrum(out);

      for (let i = 0; i < N / 2; i++) {
        const real = out[2 * i];
        const imag = out[2 * i + 1];
        const power = real * real + imag * imag;
        spectrum.push({ frequency: i / N, power });
      }
      return spectrum;
    }

    const periodogramData = computePeriodogram(values);

    const margin = { top: 10, right: 30, bottom: 80, left: 60 },
      width = chartRef.current.clientWidth - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    d3.select(chartRef.current).select("svg").remove();

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const tooltip = d3
      .select(chartRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    const chartArea = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain(d3.extent(periodogramData, (d) => d.frequency))
      .range([0, width]);

    const y = d3
      .scaleLog()
      .domain([
        d3.min(periodogramData, (d) => d.power),
        d3.max(periodogramData, (d) => d.power),
      ])
      .range([height, 0]);

    const xAxis = chartArea
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // Add the label for the x-axis
    chartArea
      .append("text")
      .attr("x", width / 2) // Position the label horizontally centered
      .attr("y", height + margin.bottom - 20) // Position the label just below the x-axis
      .style("text-anchor", "middle") // Align the text to the center
      .text("Frequency (Hz)"); // Set the label text

    const yAxis = chartArea.append("g").call(d3.axisLeft(y).ticks(5, "~s"));

    // Add the label for the y-axis
    chartArea
      .append("text")
      .attr("transform", "rotate(-90)") // Rotate label to be vertical
      .attr("y", -margin.left + 20) // Position it on the left
      .attr("x", -height / 2) // Center it vertically on the axis
      .style("text-anchor", "middle") // Align the text to the center
      .text("Power Spectral Density (℃²/Hz) (Log scale)"); // Set the label text

    // **🔹 Define Clipping Path (Restricts Drawing to Bounds)**
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    const line = d3
      .line()
      .x((d) => x(d.frequency))
      .y((d) => y(d.power));

    const lineChart = chartArea
      .append("g")
      .attr("clip-path", "url(#clip)") // Restrict drawing to bounds
      .append("path")
      .datum(periodogramData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    const focus = svg
      .append("circle")
      .attr("r", 5)
      .attr("fill", "black")
      .style("opacity", 0);

    const hoverLine = svg
      .append("line")
      .attr("stroke", "black")
      .attr("stroke-dasharray", "4")
      .style("opacity", 0);

    const bisectFrequency = d3.bisector((d) => d.frequency).left;

    function mousemove(event) {
      const [mouseX] = d3.pointer(event);
      const x0 = x.invert(mouseX);
      const i = bisectFrequency(periodogramData, x0, 1);
      const d0 = periodogramData[i - 1];
      const d1 = periodogramData[i] || d0;
      const d = x0 - d0.frequency > d1.frequency - x0 ? d1 : d0;

      focus
        .attr("cx", x(d.frequency))
        .attr("cy", y(d.power))
        .style("opacity", 1);
      hoverLine
        .attr("x1", x(d.frequency))
        .attr("x2", x(d.frequency))
        .attr("y1", 0)
        .attr("y2", height)
        .style("opacity", 1);

      tooltip
        .style("opacity", 1)
        .html(
          `Frequency: ${d.frequency.toFixed(3)} Hz<br>Power: ${d.power.toFixed(
            3
          )}`
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`);
    }

    function mouseout() {
      focus.style("opacity", 0);
      hoverLine.style("opacity", 0);
      tooltip.style("opacity", 0);
    }

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mousemove", mousemove)
      .on("mouseout", mouseout);

    // **🔹 Add Zoom Behavior (X-Axis Only)**
    const zoom = d3
      .zoom()
      .scaleExtent([1, 5]) // Allow zooming in up to 5x
      .translateExtent([
        [0, 0],
        [width, height],
      ]) // Prevent panning beyond dataset
      .extent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", (event) => {
        const newX = event.transform.rescaleX(x); // Update x-axis only
        xAxis.call(d3.axisBottom(newX)); // Redraw x-axis
        lineChart.attr(
          "d",
          d3
            .line()
            .x((d) => newX(d.frequency))
            .y((d) => y(d.power))
        ); // Update line
      });

    svg.call(zoom);
  }, [data]);

  return <div className="chart-container" ref={chartRef}></div>;
};

export default PeriodogramChart;
