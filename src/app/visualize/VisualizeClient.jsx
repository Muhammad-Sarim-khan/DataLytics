'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() =>
  import('react-plotly.js').then((mod) => {
    const Plot = mod.default;
    Plot.plotly = require('plotly.js-basic-dist'); 
    return Plot;
  }),
  { ssr: false }
);

const VisualizeClient = () => {
  const searchParams = useSearchParams();
  const featureParam = searchParams.get('features');
  const features = featureParam ? JSON.parse(featureParam) : [];

  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [plotData, setPlotData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (featuresToFetch) => {
    try {
      const params = new URLSearchParams();
      featuresToFetch.forEach((f) => params.append('features', f));
      const res = await fetch(`https://datalytics-backend-production.up.railway.app/final_dataset?${params.toString()}`);
      const json = await res.json();
      setData(json);
      return json;
    } catch (error) {
      console.error('Failed to fetch data:', error);
      return [];
    }
  };

  const handleSingleFeatureChange = (e) => {
    setSelectedFeatures([e.target.value]);
    setPlotData(null);
  };

  const handleCheckboxChange = (feature) => {
    const limit = chartType === 'bi' ? 2 : 3;
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== feature));
    } else if (selectedFeatures.length < limit) {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
    setPlotData(null);
  };

  const handlePlot = async () => {
    setLoading(true);
    try {
      let dataset = data;

      if (!data.length || !selectedFeatures.every(f => data[0] && f in data[0])) {
        dataset = await fetchData(selectedFeatures);
      }

      if (!selectedFeatures.length || !dataset.length) return;

      const plots = [];

      if (chartType === 'uni') {
        const col = selectedFeatures[0];
        const counts = {};
        dataset.forEach((row) => {
          const val = row[col];
          counts[val] = (counts[val] || 0) + 1;
        });

        const keys = Object.keys(counts);
        const isNumeric = keys.every((k) => !isNaN(k));

        plots.push({
          data: [isNumeric
            ? {
                type: 'bar',
                x: keys,
                y: Object.values(counts),
                marker: { color: '#4B9CD3' }
              }
            : {
                type: 'pie',
                labels: keys,
                values: Object.values(counts)
              }],
          layout: { title: `Univariate Plot: ${col}` }
        });

      } else if (chartType === 'bi' && selectedFeatures.length === 2) {
        const [x, y] = selectedFeatures;
        plots.push({
          data: [{
            type: 'scatter',
            mode: 'markers',
            x: dataset.map((row) => row[x]),
            y: dataset.map((row) => row[y]),
            marker: { color: '#636efa' }
          }],
          layout: {
            title: `Bivariate Plot: ${x} vs ${y}`,
            xaxis: { title: x },
            yaxis: { title: y }
          }
        });

      } else if (chartType === 'multi' && selectedFeatures.length === 3) {
        const [x, y, color] = selectedFeatures;
        plots.push({
          data: [{
            type: 'scatter',
            mode: 'markers',
            x: dataset.map((row) => row[x]),
            y: dataset.map((row) => row[y]),
            marker: {
              color: dataset.map((row) => row[color]),
              colorscale: 'Viridis',
              showscale: true
            }
          }],
          layout: {
            title: `Multivariate Plot: ${x}, ${y}, colored by ${color}`,
            xaxis: { title: x },
            yaxis: { title: y }
          }
        });
      }

      setPlotData(plots);
    } catch (err) {
      console.error('Plotting error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-aos='fade-up' className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white shadow-xl p-8 rounded-lg">
        <h1 className="text-4xl font-bold text-center text-blue-700 mb-10">
          Processed Dataset Visualization
        </h1>

        {loading && (
          <div className="text-center mt-6">
            <span className="text-lg text-purple-700 font-semibold">Loading data...</span>
          </div>
        )}

        <div className="mb-6">
          <label className="block font-semibold text-gray-700 mb-2">Select Chart Type:</label>
          <select
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={chartType}
            onChange={(e) => {
              setChartType(e.target.value);
              setSelectedFeatures([]);
              setPlotData(null);
            }}
          >
            <option value="">-- Choose --</option>
            <option value="uni">Univariate</option>
            <option value="bi">Bivariate</option>
            <option value="multi">Multivariate</option>
          </select>
        </div>

        {chartType && (
          <div className="mb-6">
            <label className="block font-semibold text-gray-700 mb-2">
              {chartType === 'uni'
                ? 'Select One Feature'
                : chartType === 'bi'
                ? 'Select Two Features'
                : 'Select Three Features (X, Y, Color)'}
            </label>

            {chartType === 'uni' ? (
              <select
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
                value={selectedFeatures[0] || ''}
                onChange={handleSingleFeatureChange}
              >
                <option value="">-- Select Feature --</option>
                {features.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {features.map((f) => {
                  const limit = chartType === 'bi' ? 2 : 3;
                  const isChecked = selectedFeatures.includes(f);
                  const disableCheck = !isChecked && selectedFeatures.length >= limit;

                  return (
                    <label
                      key={f}
                      className={`flex items-center p-2 border rounded cursor-pointer ${
                        isChecked
                          ? 'bg-purple-100 border-purple-400'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        value={f}
                        checked={isChecked}
                        disabled={disableCheck}
                        onChange={() => handleCheckboxChange(f)}
                      />
                      {f}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handlePlot}
            disabled={
              !chartType ||
              (chartType === 'uni' && selectedFeatures.length !== 1) ||
              (chartType === 'bi' && selectedFeatures.length !== 2) ||
              (chartType === 'multi' && selectedFeatures.length !== 3) ||
              loading
            }
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded transition disabled:opacity-50"
          >
            Generate Chart
          </button>
        </div>

        {plotData && plotData.length > 0 && (
          <div className="mt-10 space-y-12">
            {plotData.map((plot, idx) => (
              <Plot
                key={idx}
                data={plot.data}
                layout={plot.layout}
                style={{ width: '100%', height: '100%' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizeClient;
