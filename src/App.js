import React, { useState, useRef } from "react";
import TimeSeriesChart from "./components/TS/TimeSeriesChart";
import Spectrogram from "./components/Spectrogram/Spectrogram";
import tsData from "./components/TS/time_series_data.json";
import tsData2 from "./components/TS/time_series_data2.json";
import spData from "./components/Spectrogram/spectrogram_data2.json";
import PeriodogramChart from "./components/Periodogram/Periodogram";
import Histogram from "./components/Histogram/Histogram";
import SummaryStats from "./components/SummaryStats/SummaryStats";
import DownloadChartButton from "./components/Download/DownloadChart";
import DownloadDataSelect from "./components//Download/DownloadData";
import "./App.css";
import GaugeChart from "./components/Gauge/Gauge";
import MultiTS from "./components/MultiTS/multiTS";

function App() {
  // Define state for toggling between Time Series and Spectrogram
  const [selectedChart, setSelectedChart] = useState("timeSeries");

  // State for creating summary stats
  const [showStats, setShowStats] = useState(false); // State for stats menu visibility

  // State for toggling trendline
  const [showTrendline, setShowTrendline] = useState(false);

  // Ref for the chart container to access the SVG element
  const chartContainerRef = useRef(null);

  // Toggle the view between Spectrogram and Time Series Chart
  const toggleView = (e) => {
    setSelectedChart(e.target.value);
  };

  const toggleStats = () => {
    setShowStats((prev) => !prev);
  };

  const toggleTrendline = () => {
    setShowTrendline((prev) => !prev);
  };

  // Function to get proper chart name for download filename
  const getChartName = () => {
    switch (selectedChart) {
      case "timeSeries":
        return "Time Series Chart";
      case "multi TS":
        return "Multi Time Series";
      case "spectrogram":
        return "Spectrogram";
      case "periodogram":
        return "Periodogram";
      case "histogram":
        return "Histogram";
      case "gauge":
        return "Gauge Chart";
      default:
        return "Chart";
    }
  };

  // Function to handle visible data updates from MultiTS component
  const handleVisibleDataChange = (visibleData) => {
    window.visibleTimeSeriesData = visibleData;
  };

  // Function to handle visible data updates for second dataset from MultiTS
  const handleVisibleData2Change = (visibleData) => {
    window.visibleTimeSeriesData2 = visibleData;
  };

  return (
    <div className="App">
      <div className="header-container">
        <h1>Data Visualization</h1>

        {/* Dropdown selector to choose between charts */}
        <select value={selectedChart} onChange={toggleView}>
          <option value="timeSeries">Time Series</option>
          <option value="spectrogram">Spectrogram</option>
          <option value="periodogram">Periodogram</option>
          <option value="histogram">Histogram</option>
          <option value="gauge">GaugeChart</option>
          <option value="multi TS">Multi TimeSeries</option>
        </select>

        {/* Chart control buttons */}
        {(selectedChart === "timeSeries" || selectedChart === "multi TS") && (
          <>
            <button onClick={toggleStats}>
              {showStats
                ? "Hide Summary Statistics"
                : "Show Summary Statistics"}
            </button>
            <button onClick={toggleTrendline}>
              {showTrendline ? "Hide Trendline" : "Show Trendline"}
            </button>
          </>
        )}

        {/* Image download button */}
        <DownloadChartButton
          chartType={getChartName()}
          chartContainerRef={chartContainerRef}
        />

        {/* Data download select - only for charts with time series data */}
        {(selectedChart === "timeSeries" || selectedChart === "multi TS") && (
          <DownloadDataSelect chartTitle={getChartName()} />
        )}
      </div>

      <div className="main-container">
        {/* Chart Section */}
        <div
          className={`chart-content ${!showStats ? "full-width" : ""}`}
          ref={chartContainerRef}
        >
          {selectedChart === "timeSeries" && (
            <TimeSeriesChart data={tsData} showTrendline={showTrendline} />
          )}
          {selectedChart === "multi TS" && (
            <MultiTS
              data={tsData}
              data2={tsData2}
              showTrendline={showTrendline}
              onVisibleDataChange={handleVisibleDataChange}
              onVisibleData2Change={handleVisibleData2Change}
            />
          )}
          {selectedChart === "spectrogram" && (
            <Spectrogram spectrogramData={spData} />
          )}
          {selectedChart === "gauge" && <GaugeChart value={45} />}
          {selectedChart === "periodogram" && (
            <PeriodogramChart data={tsData} />
          )}
          {selectedChart === "histogram" && <Histogram data={tsData} />}
        </div>

        {/* Summary Stats Section */}
        {showStats && (
          <div className="stats-container">
            {selectedChart === "timeSeries" && <SummaryStats data={tsData} />}
            {selectedChart === "multi TS" && (
              <SummaryStats data={tsData} data2={tsData2} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
