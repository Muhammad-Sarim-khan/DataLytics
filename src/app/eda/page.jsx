'use client';

import { useEffect, useState } from 'react';
import UploadCSV from '../components/uploadcsv.jsx';
import EDAReport from '../components/convertpdf.jsx';
import PreprocessForm from '../components/PreprocessForm.jsx';

export default function Page() {
  const [html, setHtml] = useState('');
  const [htmlFile, setHtmlFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [datasetColumns, setDatasetColumns] = useState([]);

  const fetchReport = async (filename) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/static/reports/${filename}`);
      const text = await res.text();
      setHtml(text);
      setHtmlFile(filename);
      setShowReport(false);

    
      const colRes = await fetch(`http://localhost:5000/columns`);
      const colData = await colRes.json();
      setDatasetColumns(colData.columns);
      setProcessedData(null); 
    } catch (error) {
      console.error('Error loading report or columns:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-10">
       
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-800">ANALYZE YOUR DATASETS</h1>
          <p className="text-lg text-gray-600 mt-4">
            Upload your raw CSV datasets and get instant visual insights.
          </p>
        </div>

        
        <div className="flex justify-center items-center mb-8">
          <UploadCSV onUploadSuccess={fetchReport} loading={loading} setLoading={setLoading} />
        </div>

        
        {loading && (
          <div className="flex flex-col items-center my-8">
            <svg
              className="animate-spin h-12 w-12 text-blue-600 mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span className="text-blue-600 font-semibold text-lg">Generating Report...</span>
          </div>
        )}

        
        {html && !loading && !showReport && (
          <div className="flex flex-col items-center gap-4 mt-8">
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              onClick={() =>
                window.open(`http://localhost:5000/static/reports/${htmlFile}`, '_blank')
              }
            >
              Open Report in Browser
            </button>
            <button
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
              onClick={() => setShowReport(true)}
            >
              View Report on This Page
            </button>
          </div>
        )}

        
        {html && showReport && (
          <div className="border-t pt-8 mt-8">
            <EDAReport edaHtml={html} filename={htmlFile} />
          </div>
        )}

        {html && !loading && datasetColumns.length > 0 && (
          <div className="mt-12">
            <PreprocessForm columns={datasetColumns}/>
          </div>
        )}
      </div>
    </div>
  );
}
