import React from 'react';
import { format } from 'date-fns';

const FilterPanel = ({
  dateRange,
  onDateRangeChange,
  graphType,
  onGraphTypeChange,
  activeTab,
  clientFilters,
  onClientFiltersChange,
  inventoryFilters,
  onInventoryFiltersChange,
  onExport,
  loading
}) => {
  
  const graphTypes = [
    { value: 'pie', label: 'Pie Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'histogram', label: 'Histogram' },
    { value: 'column', label: 'Column Chart' }
  ];

  const handleStartDateChange = (e) => {
    onDateRangeChange({
      ...dateRange,
      startDate: new Date(e.target.value)
    });
  };

  const handleEndDateChange = (e) => {
    onDateRangeChange({
      ...dateRange,
      endDate: new Date(e.target.value)
    });
  };

  const handleClientFilterChange = (field, value) => {
    onClientFiltersChange({
      ...clientFilters,
      [field]: value
    });
  };

  const handleInventoryFilterChange = (field, value) => {
    onInventoryFiltersChange({
      ...inventoryFilters,
      [field]: value
    });
  };

  const formatDateForInput = (date) => {
    return format(date, 'yyyy-MM-dd');
  };

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3>Date Range</h3>
        <div className="date-inputs">
          <div className="date-input-group">
            <label>Start Date</label>
            <input
              type="date"
              value={formatDateForInput(dateRange.startDate)}
              onChange={handleStartDateChange}
              className="date-input"
            />
          </div>
          <div className="date-input-group">
            <label>End Date</label>
            <input
              type="date"
              value={formatDateForInput(dateRange.endDate)}
              onChange={handleEndDateChange}
              className="date-input"
            />
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h3>Graph Type</h3>
        <div className="filter-group">
          <label>Chart Type</label>
          <select
            value={graphType}
            onChange={(e) => onGraphTypeChange(e.target.value)}
            className="filter-select"
          >
            {graphTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === 'clients' && (
        <div className="filter-section">
          <h3>Client Filters</h3>
          <div className="filter-group">
            <label>Client Type</label>
            <select
              value={clientFilters.type}
              onChange={(e) => handleClientFilterChange('type', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="individual">Individual</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select
              value={clientFilters.status}
              onChange={(e) => handleClientFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="filter-section">
          <h3>Inventory Filters</h3>
          <div className="filter-group">
            <label>Stock Status</label>
            <select
              value={inventoryFilters.status}
              onChange={(e) => handleInventoryFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="inStock">In Stock</option>
              <option value="outOfStock">Out of Stock</option>
              <option value="lowStock">Low Stock</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select
              value={inventoryFilters.category}
              onChange={(e) => handleInventoryFilterChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
              <option value="home">Home & Garden</option>
              <option value="sports">Sports</option>
              <option value="toys">Toys</option>
              <option value="food">Food & Beverages</option>
              <option value="health">Health & Beauty</option>
              <option value="automotive">Automotive</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      )}

      <div className="export-section">
        <h3>Export Data</h3>
        <div className="export-buttons">
          <button
            onClick={() => onExport('excel')}
            disabled={loading}
            className="export-btn excel-btn"
          >
            {loading ? (
              <span>Exporting...</span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                Export to Excel
              </>
            )}
          </button>
          <button
            onClick={() => onExport('csv')}
            disabled={loading}
            className="export-btn csv-btn"
          >
            {loading ? (
              <span>Exporting...</span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                Export to CSV
              </>
            )}
          </button>
        </div>
      </div>

      <div className="filter-info">
        <div className="info-item">
          <span className="info-label">Current View:</span>
          <span className="info-value">{activeTab === 'clients' ? 'Client Analytics' : 'Inventory Analytics'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Date Range:</span>
          <span className="info-value">
            {format(dateRange.startDate, 'MMM dd, yyyy')} - {format(dateRange.endDate, 'MMM dd, yyyy')}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Graph Type:</span>
          <span className="info-value">{graphTypes.find(t => t.value === graphType)?.label}</span>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;