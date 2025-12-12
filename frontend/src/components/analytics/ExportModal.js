import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { FaTimes, FaDownload, FaImage, FaFilePdf, FaFileExcel } from 'react-icons/fa';

const ExportModal = ({ chartRef, chartTitle, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('png');

  const exportFormats = [
    { value: 'png', label: 'PNG Image', icon: <FaImage /> },
    { value: 'pdf', label: 'PDF Document', icon: <FaFilePdf /> },
    { value: 'excel', label: 'Excel File', icon: <FaFileExcel /> }
  ];

  const handleExport = async () => {
    if (!chartRef) return;
    
    setLoading(true);
    try {
      switch (selectedFormat) {
        case 'png':
          await exportAsPNG();
          break;
        case 'pdf':
          await exportAsPDF();
          break;
        case 'excel':
          await exportAsExcel();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export chart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportAsPNG = async () => {
    const canvas = await html2canvas(chartRef.current?.canvas || chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false
    });

    const link = document.createElement('a');
    link.download = `${chartTitle || 'chart'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportAsPDF = async () => {
    const canvas = await html2canvas(chartRef.current?.canvas || chartRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape');
    
    // Calculate dimensions to fit page
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgAspectRatio = canvas.width / canvas.height;
    const pdfAspectRatio = pdfWidth / pdfHeight;
    
    let imgWidth, imgHeight;
    if (imgAspectRatio > pdfAspectRatio) {
      imgWidth = pdfWidth - 20; // 10px margin on each side
      imgHeight = imgWidth / imgAspectRatio;
    } else {
      imgHeight = pdfHeight - 20; // 10px margin on each side
      imgWidth = imgHeight * imgAspectRatio;
    }

    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    // Add title
    pdf.setFontSize(16);
    pdf.text(chartTitle || 'Chart Export', 10, 15);
    
    // Add chart
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    
    // Add timestamp
    pdf.setFontSize(8);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 10, pdfHeight - 5);
    
    pdf.save(`${chartTitle || 'chart'}.pdf`);
  };

  const exportAsExcel = async () => {
    // This is a simplified version - in a real implementation,
    // you would extract the actual chart data and export it
    const sampleData = [
      { Category: 'Sample Data', Value: 'Chart data would be extracted here' },
      { Category: 'Export Time', Value: new Date().toLocaleString() },
      { Category: 'Chart Title', Value: chartTitle || 'Untitled Chart' }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chart Data');
    
    XLSX.writeFile(workbook, `${chartTitle || 'chart'}-data.xlsx`);
  };

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        <div className="export-modal-header">
          <h3>Export Chart: {chartTitle}</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="export-modal-content">
          <p>Select export format:</p>
          <div className="export-options">
            {exportFormats.map((format) => (
              <div
                key={format.value}
                className={`export-option ${selectedFormat === format.value ? 'selected' : ''}`}
                onClick={() => setSelectedFormat(format.value)}
              >
                {format.icon}
                <span>{format.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="export-modal-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExport} 
            disabled={loading || !chartRef}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Exporting...
              </>
            ) : (
              <>
                <FaDownload />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;