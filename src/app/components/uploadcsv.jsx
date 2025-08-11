'use client';

import { useState } from 'react';

export default function UploadCSV({ onUploadSuccess, loading, setLoading }) {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a CSV file.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('dataset', file);

    try {
      const res = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json(); 

      if (res.ok && data.filename) {
        onUploadSuccess(data.filename);
      } else {
        alert('Error generating report.');
        setLoading(false);
      }
    } catch (err) {
      alert('Error: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center space-y-4"
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        required
        className=" ml-5 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-50 file:text-blue-700
        file:cursor-pointer
        hover:file:bg-blue-100"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mr-10 mt-5 cursor-pointer"
      >
        {loading ? 'Generating Report....' : 'Upload and Generate Report'}
      </button>
    </form>
  );
}
