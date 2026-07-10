import React, { useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { clientAPI } from '../services/api';
import './ExcelImport.css';

const ExcelImport = ({ type, onSuccess, onClose }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview & Map, 3: Import

  // Expected fields for each type
  const expectedFields = {
    clients: [
      { key: 'name', label: 'Name', required: true },
      { key: 'email', label: 'Email', required: true },
      { key: 'phone', label: 'Phone', required: false },
      { key: 'company', label: 'Company', required: false },
      { key: 'address', label: 'Address', required: false },
      { key: 'city', label: 'City', required: false },
      { key: 'state', label: 'State', required: false },
      { key: 'zipCode', label: 'Zip Code', required: false },
      { key: 'notes', label: 'Notes', required: false },
      { key: 'status', label: 'Status', required: false }
    ],
    inventory: [
      { key: 'name', label: 'Item Name', required: true },
      { key: 'category', label: 'Category', required: false },
      { key: 'description', label: 'Description', required: false },
      { key: 'quantity', label: 'Quantity', required: false },
      { key: 'unitPrice', label: 'Unit Price', required: false },
      { key: 'supplier', label: 'Supplier', required: false },
      { key: 'sku', label: 'SKU', required: false },
      { key: 'status', label: 'Status', required: false },
      { key: 'reorderLevel', label: 'Reorder Level', required: false }
    ]
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(uploadedFile.type)) {
      setError('Please upload a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    setFile(uploadedFile);
    setError('');
    parseExcelFile(uploadedFile);
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          setError('Excel file must contain at least a header row and one data row');
          return;
        }

        // First row is headers
        const fileHeaders = jsonData[0].map(header => String(header).trim());
        const dataRows = jsonData.slice(1, 6); // Preview first 5 rows

        setHeaders(fileHeaders);
        setPreviewData(dataRows);
        setStep(2);

        // Auto-map headers that match expected fields
        const autoMapping = {};
        expectedFields[type].forEach(field => {
          const matchingHeader = fileHeaders.find(header => 
            header.toLowerCase().includes(field.key.toLowerCase()) ||
            header.toLowerCase().includes(field.label.toLowerCase())
          );
          if (matchingHeader) {
            autoMapping[field.key] = matchingHeader;
          }
        });
        setMapping(autoMapping);

      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setError('Error reading Excel file. Please check the file format.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleMappingChange = (fieldKey, headerValue) => {
    setMapping(prev => ({
      ...prev,
      [fieldKey]: headerValue
    }));
  };

  const validateMapping = () => {
    const requiredFields = expectedFields[type].filter(field => field.required);
    const missingFields = requiredFields.filter(field => !mapping[field.key]);
    
    if (missingFields.length > 0) {
      setError(`Please map required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return false;
    }
    
    setError('');
    return true;
  };

  const processImportData = async () => {
    if (!validateMapping()) return;

    setLoading(true);
    setError('');

    try {
      // Parse entire file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const fileHeaders = jsonData[0];
          const dataRows = jsonData.slice(1);

          // Transform data according to mapping
          const transformedData = dataRows.map((row, index) => {
            const record = {};
            
            expectedFields[type].forEach(field => {
              const headerIndex = fileHeaders.indexOf(mapping[field.key]);
              if (headerIndex !== -1) {
                let value = row[headerIndex];
                
                // Clean up the value - convert null/undefined to empty string, trim whitespace
                if (value === null || value === undefined) {
                  value = '';
                } else {
                  value = String(value).trim();
                }
                
                // Type conversion for specific fields
                if (['quantity', 'unitPrice', 'reorderLevel'].includes(field.key)) {
                  value = parseFloat(value) || 0;
                }
                
                // Only set non-empty values for optional fields, always set required fields
                if (field.required) {
                  record[field.key] = value; // Always set required fields, even if empty
                } else if (value !== '') {
                  record[field.key] = value; // Only set optional fields if they have values
                }
              } else if (field.required) {
                throw new Error(`Missing required field ${field.label} in row ${index + 2}`);
              }
            });

            // Set default values (exactly like working client pattern)
            if (type === 'clients') {
              record.status = record.status || 'Active';
            } else if (type === 'inventory') {
              record.status = record.status || 'In Stock';
            }

            return record;
          });

          // Send to backend using API service
          const response = type === 'clients' 
            ? await clientAPI.bulkImport(transformedData)
            : null; // Inventory functionality removed

          if (!response) {
            throw new Error('Inventory import not supported');
          }

          setStep(3);
          
          // Trigger refresh on parent component
          if (onSuccess) {
            onSuccess(response.data);
          }

        } catch (parseError) {
          console.error('Error processing import:', parseError);
          
          // Better error handling
          let errorMessage = 'Error processing import data';
          if (parseError.response) {
            // Server responded with error status
            errorMessage = parseError.response.data?.message || `Server error: ${parseError.response.status}`;
          } else if (parseError.request) {
            // Request was made but no response received
            errorMessage = 'Unable to connect to server. Please check if the backend is running.';
          } else {
            // Something else happened
            errorMessage = parseError.message || 'An unexpected error occurred';
          }
          
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };

      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error('Import error:', error);
      
      // Better error handling for outer catch
      let errorMessage = 'Failed to import data';
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Unable to connect to server. Please check if the backend is running.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreviewData([]);
    setHeaders([]);
    setMapping({});
    setError('');
    setStep(1);
  };

  return (
    <div className="excel-import-modal">
      <div className="import-content">
        <div className="import-header">
          <h2>Import {type === 'clients' ? 'Clients' : 'Inventory'} from Excel</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="upload-step">
            <div className="upload-zone">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="file-input"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="upload-label">
                <div className="upload-icon">📁</div>
                <p>Click to select Excel file (.xlsx, .xls, .csv)</p>
                <p className="upload-hint">File should contain column headers in the first row</p>
              </label>
            </div>

            <div className="expected-format">
              <h3>Expected Format:</h3>
              <div className="format-list">
                {expectedFields[type].map(field => (
                  <span key={field.key} className={`format-field ${field.required ? 'required' : ''}`}>
                    {field.label} {field.required && '*'}
                  </span>
                ))}
              </div>
              <p className="format-note">* Required fields</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mapping-step">
            <h3>Map Your Columns</h3>
            <p>Match your Excel columns to the expected fields:</p>

            <div className="mapping-container">
              <div className="mapping-list">
                {expectedFields[type].map(field => (
                  <div key={field.key} className="mapping-row">
                    <label className={`field-label ${field.required ? 'required' : ''}`}>
                      {field.label} {field.required && '*'}
                    </label>
                    <select
                      value={mapping[field.key] || ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      className="mapping-select"
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="preview-section">
                <h4>Preview (First 5 rows):</h4>
                <div className="preview-table">
                  <table>
                    <thead>
                      <tr>
                        {headers.map(header => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="import-actions">
              <button className="btn btn-secondary" onClick={resetImport}>
                Back
              </button>
              <button 
                className="btn btn-primary" 
                onClick={processImportData}
                disabled={loading}
              >
                {loading ? 'Importing...' : 'Import Data'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="success-step">
            <div className="success-icon"><FiCheckCircle /></div>
            <h3>Import Successful!</h3>
            <p>Your {type} data has been imported successfully.</p>
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelImport;