'use client';

import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function EDAReport({ edaHtml, filename }) {
  const reportRef = useRef();

  const generatePDF = async () => {
    const element = reportRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('eda_report.pdf');
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={generatePDF}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Download PDF
        </button>

        {filename && (
          <a
            href={`http://localhost:5000/static/reports/${filename}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              View Report in Browser
            </button>
          </a>
        )}
      </div>

      <div
        ref={reportRef}
        className="bg-white p-6 rounded-lg shadow max-h-[600px] overflow-y-scroll border"
      >
        <div dangerouslySetInnerHTML={{ __html: edaHtml }} />
      </div>
    </div>
  );
}
