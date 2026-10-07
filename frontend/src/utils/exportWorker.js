/**
 * High-Performance Background Export Engine
 * Offloads Excel and CSV file generation to prevent UI freeze on large datasets.
 */

// Asynchronous yield helper to prevent main thread blocking
export const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Asynchronously generates an Excel file from JSON data in chunks,
 * yielding periodically to keep UI animations smooth.
 * 
 * @param {Array} rows - Formatted row objects
 * @param {string} sheetName - Name of the worksheet
 * @param {string} fileName - File name to download
 * @param {Array} columnWidths - Optional column width specifications
 */
export const asyncExportToExcel = async (rows, sheetName = 'Data', fileName = 'export.xlsx', columnWidths = null) => {
  // Yield before loading heavy XLSX library
  await yieldToMain();
  
  const XLSX = await import('xlsx');
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Process large datasets in micro-batches
  const BATCH_SIZE = 500;
  const processedRows = [];
  
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    processedRows.push(...batch);
    if (i + BATCH_SIZE < rows.length) {
      await yieldToMain();
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(processedRows);

  if (columnWidths && Array.isArray(columnWidths)) {
    worksheet['!cols'] = columnWidths;
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  await yieldToMain();
  
  // Generate and trigger download
  XLSX.writeFile(workbook, fileName);
  
  return { success: true, count: rows.length, fileName };
};

/**
 * Asynchronously generates a CSV file with non-blocking streaming
 */
export const asyncExportToCSV = async (data, fileName = 'export.csv') => {
  await yieldToMain();
  
  if (!data || !data.length) {
    throw new Error('No data available to export');
  }

  const headers = Object.keys(data[0]);
  const csvLines = [headers.join(',')];

  const BATCH_SIZE = 500;
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    
    batch.forEach(row => {
      const line = headers.map(header => {
        let val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
        // Escape quotes and wrap commas in quotes
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
      csvLines.push(line);
    });

    if (i + BATCH_SIZE < data.length) {
      await yieldToMain();
    }
  }

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: data.length, fileName };
};

export default {
  asyncExportToExcel,
  asyncExportToCSV,
  yieldToMain
};
