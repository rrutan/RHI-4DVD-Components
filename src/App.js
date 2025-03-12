import React, { useState } from "react"; // Ensure useState is imported
import TimeSeriesChart from "./components/TS/TimeSeriesChart";
import Spectrogram from "./components/Spectrogram/Spectrogram"; // Ensure the correct import path
import tsData from "./components/TS/time_series_data.json";
import spData from "./components/Spectrogram/spectrogram_data2.json";
import PeriodogramChart from "./components/Periodogram/Periodogram";
import Histogram from "./components/Histogram/Histogram";
import SummaryStats from "./components/SummaryStats/SummaryStats";
import "./App.css";
import GaugeChart from "./components/Gauge/Gauge";

function App() {
  // Define state for toggling between Time Series and Spectrogram
  const [selectedChart, setSelectedChart] = useState("timeSeries");

  // State for creating summary stats
  const [showStats, setShowStats] = useState(false); // State for stats menu visibility

  // State for toggling trendline
  const [showTrendline, setShowTrendline] = useState(false);

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
        </select>

        {/* Show the stats button ONLY when Time Series is selected */}
        {selectedChart === "timeSeries" && (
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
      </div>

      <div className="main-container">
        {/* Chart Section */}
        <div className="chart-content">
          {selectedChart === "timeSeries" && (
            <TimeSeriesChart data={tsData} showTrendline={showTrendline} />
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

        {/* Summary Stats Section (Only Rendered if button was clicked) */}
        {selectedChart === "timeSeries" && showStats && (
          <div className="summary-stats">
            <SummaryStats data={tsData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
