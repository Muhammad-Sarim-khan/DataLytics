// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
//       <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={180}
//           height={38}
//           priority
//         />
//         <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
//           <li className="mb-2 tracking-[-.01em]">
//             Get started by editing{" "}
//             <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
//               src/app/page.js
//             </code>
//             .
//           </li>
//           <li className="tracking-[-.01em]">
//             Save and see your changes instantly.
//           </li>
//         </ol>

//         <div className="flex gap-4 items-center flex-col sm:flex-row">
//           <a
//             className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={20}
//               height={20}
//             />
//             Deploy now
//           </a>
//           <a
//             className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Read our docs
//           </a>
//         </div>
//       </main>
//       <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/file.svg"
//             alt="File icon"
//             width={16}
//             height={16}
//           />
//           Learn
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/window.svg"
//             alt="Window icon"
//             width={16}
//             height={16}
//           />
//           Examples
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/globe.svg"
//             alt="Globe icon"
//             width={16}
//             height={16}
//           />
//           Go to nextjs.org →
//         </a>
//       </footer>
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import UploadCSV from './components/uploadcsv.jsx';
import EDAReport from './components/convertpdf.jsx';
import PreprocessForm from './components/PreprocessForm.jsx';

export default function Page() {
  const [html, setHtml] = useState('');
  const [htmlFile, setHtmlFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [datasetColumns, setDatasetColumns] = useState({});

  const fetchReport = async (filename) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/static/reports/${filename}`);
      const text = await res.text();
      setHtml(text);
      setHtmlFile(filename);
      setShowReport(false);
      setProcessedData(null);

      const colRes = await fetch(`http://localhost:5000/column_metadata`);
      const metaData = await colRes.json();

      const colMetaObject = {};
      metaData.forEach((item) => {
        colMetaObject[item.column] = {
          nulls: item.nulls,
          outliers: item.outliers,
          dtype: item.dtype,
        };
      });

      setDatasetColumns(colMetaObject);
    } catch (error) {
      console.error('Error loading report or columns:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-aos='fade-right' className="min-h-screen bg-gray-100 py-10 px-4">
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
              className="mr-10 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              onClick={() =>
                window.open(`http://localhost:5000/static/reports/${htmlFile}`, '_blank')
              }
            >
              Open Report in Browser
            </button>
          </div>
        )}

        {html && showReport && (
          <div className="border-t pt-8 mt-8">
            <EDAReport edaHtml={html} filename={htmlFile} />
          </div>
        )}

        {html && !loading && Object.keys(datasetColumns).length > 0 && (
          <div className="mt-12">
            <PreprocessForm
              columns={datasetColumns}
              onProcessed={(updatedColumns) => {
                setDatasetColumns(updatedColumns);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}


