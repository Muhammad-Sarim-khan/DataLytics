'use client';

import { useState } from 'react';

export default function PreprocessForm({ onProcessed, columns }) {
  const [missingOption, setMissingOption] = useState('mean');
  const [encodeOption, setEncodeOption] = useState('label');
  const [scalingOption, setScalingOption] = useState('none');
  const [selectedEncodeCols, setSelectedEncodeCols] = useState([]);
  const [selectedScaleCols, setSelectedScaleCols] = useState([]);
  const [correlationTable, setCorrelationTable] = useState(null);
  const [heatmapUrl, setHeatmapUrl] = useState('');
  const [selectableColumns, setSelectableColumns] = useState([]);
  const [selectedExportCols, setSelectedExportCols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [processedData, setProcessedData] = useState(null);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    const options = {
      missing: missingOption,
      encode: encodeOption,
      encode_columns: selectedEncodeCols,
      scaling: scalingOption,
      scale_columns: selectedScaleCols,
    };
    formData.append('options', JSON.stringify(options));

    try {
     
      const result = await fetch('http://localhost:5000/preprocess', {
        method: 'POST',
        body: formData,
      });

      if (!result.ok) {
        throw new Error('Preprocessing failed.');
      }

      const processed = await result.json();
      setProcessedData(processed);

      
      const corrRes = await fetch('http://localhost:5000/correlation');
      if (!corrRes.ok) {
        throw new Error('Failed to fetch correlation.');
      }

      const corrData = await corrRes.json();
      setCorrelationTable(corrData.correlation_table);
      setHeatmapUrl(`http://localhost:5000${corrData.heatmap_path}`);
      setSelectableColumns(Object.keys(corrData.correlation_table));
      setShowDownload(true);
    } catch (err) {
      console.error('Error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (col, type) => {
    if (type === 'encode') {
      setSelectedEncodeCols((prev) =>
        prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
      );
    } else if (type === 'scale') {
      setSelectedScaleCols((prev) =>
        prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
      );
    } else if (type === 'export') {
      setSelectedExportCols((prev) =>
        prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
      );
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch('http://localhost:5000/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_columns: selectedExportCols }),
      });

      if (!res.ok) {
        throw new Error('Download failed.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Preprocessed_Dataset.csv';
      a.click();
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download CSV.');
    }
  };

  return (
    <div className="mt-10 border-t pt-10 pb-10">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Preprocess Your Dataset
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-2xl mx-auto bg-gray-50 p-6 rounded-xl shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Handle Missing Values:</label>
            <select
              value={missingOption}
              onChange={(e) => setMissingOption(e.target.value)}
              className="w-full p-2 border rounded-md bg-white text-gray-700"
            >
              <option value="mean">Mean Imputation</option>
              <option value="median">Median Imputation</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Encode Method:</label>
            <select
              value={encodeOption}
              onChange={(e) => setEncodeOption(e.target.value)}
              className="w-full p-2 border rounded-md bg-white text-gray-700"
            >
              <option value="label">Label Encoding</option>
              <option value="onehot" disabled>One-Hot Encoding (Not implemented)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Feature Scaling:</label>
            <select
              value={scalingOption}
              onChange={(e) => setScalingOption(e.target.value)}
              className="w-full p-2 border rounded-md bg-white text-gray-700"
            >
              <option value="none">None</option>
              <option value="standard">Standard Scaler</option>
              <option value="minmax">Min-Max Scaler</option>
            </select>
          </div>
        </div>

        {columns?.length > 0 && (
          <>
            <div className="mt-6">
              <label className="block text-gray-700 font-medium mb-2">Select Columns for Encoding:</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {columns.map((col) => (
                  <label key={col} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedEncodeCols.includes(col)}
                      onChange={() => toggleSelection(col, 'encode')}
                    />
                    {col}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 font-medium mb-2">Select Columns for Scaling:</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {columns.map((col) => (
                  <label key={col} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedScaleCols.includes(col)}
                      onChange={() => toggleSelection(col, 'scale')}
                    />
                    {col}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-center">
          <button
            type="submit"
            className={`px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Apply Preprocessing'}
          </button>
        </div>
      </form>

      
      {processedData && Array.isArray(processedData) && processedData.length > 0 && (
          <div className="mt-10 border-t pt-8 border-b pb-10">
            <h3 className="text-2xl font-semibold mb-10 text-center">Processed Dataset Preview</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded">
                <thead>
                  <tr>
                    {Object.keys(processedData[0]).map((col) => (
                      <th key={col} className="border px-4 py-2 bg-gray-200 text-left">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {Object.values(row).map((val, i) => (
                        <td key={i} className="border px-4 py-2">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      

      {heatmapUrl && (
        <div className="mt-10 text-center">
          <h3 className="text-2xl font-bold mb-10">Correlation Heatmap</h3>
          <img src={heatmapUrl} alt="Correlation Heatmap" className="mx-auto rounded shadow-md max-w-full" />
        </div>
      )}

      {correlationTable && (
        <div className="mt-10 overflow-x-auto">
          <h3 className="text-2xl font-bold mb-10 mt-5 text-center">Correlation Table</h3>
          <table className="min-w-full bg-white border rounded shadow-md">
            <thead>
              <tr>
                <th className="border px-4 py-2 bg-gray-200">Feature</th>
                {Object.keys(correlationTable).map((col) => (
                  <th key={col} className="border px-4 py-2 bg-gray-200">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(correlationTable).map(([rowKey, rowVals]) => (
                <tr key={rowKey}>
                  <td className="border px-4 py-2 font-semibold">{rowKey}</td>
                  {Object.values(rowVals).map((val, i) => (
                    <td key={i} className="border px-4 py-2 text-sm text-center">{val?.toFixed?.(2) ?? 'N/A'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDownload && selectableColumns.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-10 mt-15 text-center">Feature Selection</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto text-center">
            {selectableColumns.map((col) => (
              <label key={col} className="inline-flex items-center justify-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={selectedExportCols.includes(col)}
                  onChange={() => toggleSelection(col, 'export')}
                />
                {col}
              </label>
            ))}
          </div>
          <div className="flex justify-center mt-13">
            <button
              onClick={handleDownload}
              disabled={selectedExportCols.length === 0}
              className={`px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition ${
                selectedExportCols.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Download Preprocessed Dataset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
