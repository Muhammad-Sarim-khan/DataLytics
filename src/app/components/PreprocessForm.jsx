'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PreprocessForm({ onProcessed, columns }) {
  // Setting the threshold for null values (0.0 means show columns having 0 nulls)
  const NULL_THRESHOLD = 0.0; 
  const [missingOption, setMissingOption] = useState('mean');
  const [encodeOption, setEncodeOption] = useState('label');
  const [scalingOption, setScalingOption] = useState('none');
  const [selectedEncodeCols, setSelectedEncodeCols] = useState([]);
  const [selectedScaleCols, setSelectedScaleCols] = useState([]);
  const [selectedOutlierCols, setSelectedOutlierCols] = useState([]);
  const [correlationTable, setCorrelationTable] = useState(null);
  const [heatmapUrl, setHeatmapUrl] = useState('');
  const [selectableColumns, setSelectableColumns] = useState([]);
  const [selectedExportCols, setSelectedExportCols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [highNullColumns, setHighNullColumns] = useState([]);
  const [targetCol, setTargetCol] = useState('');
  const [featureCol, setFeatureCol] = useState('');
  const [pairCorr, setPairCorr] = useState(null);
  const [pairError, setPairError] = useState('');

  const router = useRouter();

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        // Use /column_metadata for highNullColumns (reflects LAST_UPLOADED_DF)
        const res = await fetch('http://localhost:5000/column_metadata');
        const data = await res.json();
        // data is an array of { column, nulls, outliers, dtype }
        const highNulls = data
          .filter((val) => (val.nulls / (val.total_rows ?? 1)) >= NULL_THRESHOLD)
          .map((val) => {
            const total = val.total_rows ?? 1000;
            return {
              name: val.column,
              nulls: val.nulls,
              nullPercentage: ((val.nulls / total) * 100).toFixed(1),
            };
          });
        setHighNullColumns(highNulls);
      } catch (err) {
        console.error('Error fetching column metadata:', err);
      }
    };
    fetchColumns();
  }, [columns]);

  const handleRemoveColumn = async (colName) => {
    try {
      const res = await fetch('http://localhost:5000/remove_column', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column: colName }),
      });
      if (!res.ok) throw new Error('Column removal failed.');
      alert(`Column "${colName}" removed.`);
      // Fetch latest columns from /column_metadata (reflects LAST_UPLOADED_DF)
      const updatedRes = await fetch('http://localhost:5000/column_metadata');
      const updatedData = await updatedRes.json();
      // Converting array to object for parent columns state
      const updatedColumns = {};
      updatedData.forEach((item) => {
        updatedColumns[item.column] = {
          nulls: item.nulls,
          outliers: item.outliers,
          dtype: item.dtype,
        };
      });
      onProcessed && onProcessed(updatedColumns);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to remove column.');
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    const options = {
      missing: missingOption,
      // encode: encodeOption,
      // encode_columns: selectedEncodeCols,
      scaling: scalingOption,
      scale_columns: selectedScaleCols,
      outlier_columns: selectedOutlierCols,
    };
    formData.append('options', JSON.stringify(options));

    try {
      const result = await fetch('http://localhost:5000/preprocess', {
        method: 'POST',
        body: formData,
      });

      if (!result.ok) throw new Error('Preprocessing failed.');

      const processed = await result.json();
      setProcessedData(processed);

      const corrRes = await fetch('http://localhost:5000/correlation');
      if (!corrRes.ok) throw new Error('Failed to fetch correlation.');

      const corrData = await corrRes.json();
      setCorrelationTable(corrData.correlation_table);
      setHeatmapUrl(`http://localhost:5000${corrData.heatmap_path}`);

      setSelectableColumns(corrData.selectable_columns || []);
      ;

      setShowDownload(true);
    } catch (err) {
      console.error('Error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };


  const toggleSelection = (col, type) => {
    const setter = {
      // encod: setSelectedEncodeCols,
      scal: setSelectedScaleCols,
      export: setSelectedExportCols,
      outlier: setSelectedOutlierCols,
    }[type];

    setter((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]));
  };

  const handleDownload = async () => {
    try {
      const res = await fetch('http://localhost:5000/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_columns: selectedExportCols }),
      });

      if (!res.ok) throw new Error('Download failed.');

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

  const getColumnMeta = (col) => {
    if (columns && typeof columns[col] === 'object') {
      const { nulls, outliers, dtype } = columns[col];
      return ` | Nulls: ${nulls} | Outliers: ${outliers} | Type: ${dtype}`;
    }
    return '';
  };

  const fetchPairCorrelation = async () => {
    setPairCorr(null);
    setPairError('');
    if (!targetCol || !featureCol) {
      setPairError('Please select both target and feature columns.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/correlation_pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetCol, feature: featureCol }),
      });

      const data = await res.json();

      if (data.correlation === null) {
        setPairError(data.error || 'No correlation could be calculated.');
      } else {
        setPairCorr(data.correlation);
      }
    } catch (err) {
      console.error('Error fetching pair correlation:', err);
      setPairError('Error checking correlation.');
    }
  };



  return (
    <div className="mt-10 border-t pt-10 pb-10">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Preprocess Your Dataset
      </h2>

      {highNullColumns.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded mb-6 max-w-3xl mx-auto">
          <p className="font-semibold mb-2">Suggestion: Remove columns with high missing values</p>
          {highNullColumns.map((col) => (
            <div key={col.name} className="flex justify-between items-center bg-white p-2 border rounded mb-2">
              <span className="text-sm">
                {col.name} ({col.nullPercentage}% missing)
              </span>
              <button
                onClick={() => handleRemoveColumn(col.name)}
                className="bg-red-600 text-white text-sm px-3 py-1 rounded hover:bg-red-700"
              >
                Remove Column
              </button>
            </div>
          ))}
        </div>
      )}

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

          {/* <div>
            <label className="block text-gray-700 font-medium mb-2">Encode Method:</label>
            <select
              value={encodeOption}
              onChange={(e) => setEncodeOption(e.target.value)}
              className="w-full p-2 border rounded-md bg-white text-gray-700"
            >
              <option value="label">Label Encoding</option>
            </select>
          </div> */}

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

        {columns && Object.keys(columns).length > 0 && (
          <>
            {['scal', 'outlier'].map((type) => (
              <div key={type} className="mt-6">
                <label className="block text-gray-700 font-medium mb-2 capitalize">
                  Select Columns for {type === 'outlier' ? 'Outlier Handling' : `${type}ing`}:
                </label>
                <div className="flex flex-col space-y-2 max-h-60 overflow-y-auto text-sm pr-2">
                  {Object.keys(columns).map((col) => (
                    <label
                      key={`${type}-${col}`}
                      className="flex items-start space-x-2 bg-white p-2 rounded-md border hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={
                          // type === 'encod'
                          //   ? selectedEncodeCols.includes(col)
                          type === 'scal'
                            ? selectedScaleCols.includes(col)
                            : selectedOutlierCols.includes(col)
                        }
                        onChange={() => toggleSelection(col, type)}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">{col}</span>
                        <span className="text-gray-500 text-xs">{getColumnMeta(col)}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        <div className="flex justify-center mt-6">
          <button
            type="submit"
            className={`px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''
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

      {correlationTable && (
        <div className="mt-12">
          <h3 className="text-2xl font-semibold text-center mb-6">Target-Feature Correlation Checker</h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <div>
              <label className="block mb-1 font-medium">Select Target Variable</label>
              <select
                className="p-2 border rounded"
                onChange={(e) => setTargetCol(e.target.value)}
                value={targetCol}
              >
                <option value="">-- Select Target --</option>
                {Object.keys(columns).map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">Select Feature Variable</label>
              <select
                className="p-2 border rounded"
                onChange={(e) => setFeatureCol(e.target.value)}
                value={featureCol}
              >
                <option value="">-- Select Feature --</option>
                {Object.keys(columns).map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={fetchPairCorrelation}
            >
              Check Correlation
            </button>
          </div>

          {pairCorr !== null && (
            <div className="text-center mt-6 text-lg text-gray-800 font-semibold">
              Correlation between <span className="text-blue-600">{featureCol}</span> and <span className="text-blue-600">{targetCol}</span>: <span className="text-green-700">{pairCorr}</span>
            </div>
          )}

          {pairError && (
            <div className="text-center mt-4 text-red-600 font-medium">{pairError}</div>
          )}
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
              className={`px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition ${selectedExportCols.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              Download Preprocessed Dataset
            </button>
          </div>
        </div>
      )}
      {showDownload && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() =>
              router.push(
                `/visualize?features=${encodeURIComponent(JSON.stringify(selectedExportCols))}`
              )
            }
            className="ml-4 px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
          >
            Go to Visualizations
          </button>
        </div>
      )}

    </div>
  );
}
