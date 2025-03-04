import React, { useState } from "react"; // Ensure useState is imported
import TimeSeriesChart from "./components/TS/TimeSeriesChart";
import Spectrogram from "./components/Spectrogram/Spectrogram"; // Ensure the correct import path
import tsData from "./components/TS/time_series_data.json";
import spData from "./components/Spectrogram/spectrogram_data2.json";
import PeriodogramChart from "./components/Periodogram/Periodogram";
import Histogram from "./components/Histogram/Histogram";
import "./App.css";

function App() {
  // Define state for toggling between Time Series and Spectrogram
  const [selectedChart, setSelectedChart] = useState("timeSeries");

  // Toggle the view between Spectrogram and Time Series Chart
  const toggleView = (e) => {
    setSelectedChart(e.target.value);
  };

  return (
    <div className="App">
      <div className="chart-selector">
        <h1>Data Visualization</h1>

        {/* Dropdown selector to choose between Time Series, Spectrogram, or Periodogram */}
        <select value={selectedChart} onChange={toggleView}>
          <option value="timeSeries">Time Series</option>
          <option value="spectrogram">Spectrogram</option>
          <option value="periodogram">Periodogram</option>
          <option value="histogram">Histogram</option>
        </select>

        {/* Conditional rendering based on selected chart */}
        {selectedChart === "timeSeries" && <TimeSeriesChart data={tsData} />}
        {selectedChart === "spectrogram" && (
          <Spectrogram spectrogramData={spData} />
        )}
        {selectedChart === "periodogram" && <PeriodogramChart data={tsData} />}
        {selectedChart === "histogram" && <Histogram data={tsData} />}
      </div>
    </div>
  );
}

export default App;
