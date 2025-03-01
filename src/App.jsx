import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import './App.css';

function App() {
  const [pdfFileName, setPdfFileName] = useState('merged.pdf'); // Default file name
  const [pdfFile, setPdfFile] = useState(null);
  const [mergedPdfUrl, setMergedPdfUrl] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        setPdfFile(file);
        setMergedPdfUrl(null);
        setError('');

        // Extract the original file name (without extension)
        const originalName = file.name.replace(/\.[^/.]+$/, ""); // Removes extension
        setPdfFileName(`${originalName}_merged.pdf`);
    } else {
        setPdfFile(null);
        setPdfFileName("merged.pdf"); // Default name if no file is selected
    }
  };


  const handleMergePdf = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file first.');
      return;
    }

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const pageCount = originalPdf.getPageCount();
      const newPdf = await PDFDocument.create();

      for (let i = 0; i < pageCount; i += 2) {
        const [pageA] = await newPdf.embedPages([originalPdf.getPages()[i]]);
        const pageBRef =
          i + 1 < pageCount ? originalPdf.getPages()[i + 1] : null;
        const pageB = pageBRef ? await newPdf.embedPages([pageBRef]) : null;

        const { width: widthA, height: heightA } = pageA;
        let newPageWidth = widthA;
        let newPageHeight = heightA;

        if (pageB) {
          const { width: widthB, height: heightB } = pageB[0];
          newPageWidth = widthA + widthB;
          newPageHeight = Math.max(heightA, heightB);

          const newPage = newPdf.addPage([newPageWidth, newPageHeight]);
          newPage.drawPage(pageA, { x: 0, y: 0, width: widthA, height: heightA });
          newPage.drawPage(pageB[0], { x: widthA, y: 0, width: widthB, height: heightB });
        } else {
          const newPage = newPdf.addPage([newPageWidth, newPageHeight]);
          newPage.drawPage(pageA, { x: 0, y: 0, width: widthA, height: heightA });
        }
      }

      const mergedPdfBytes = await newPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setMergedPdfUrl(url);
    } catch (err) {
      console.error(err);
      setError('An error occurred while merging the PDF.');
    }
  };

  return (
    <div class="page">
      <h1>PDF Page Combiner</h1>
      <input class="fileChose" type="file" accept="application/pdf" onChange={handleFileChange} />
      <button class="mergeButton" onClick={handleMergePdf} >
        Merge
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {mergedPdfUrl && (
        <div>
          <p>Download your merged PDF:</p>
          <a href={mergedPdfUrl} download={pdfFileName}>
            Download {pdfFileName}
          </a>
        </div>
      )}
    </div>
  );
}

export default App;

