import React, { useState, useRef, useEffect } from 'react';
import { FaCalendarAlt, FaChevronDown, FaFilter } from 'react-icons/fa';

const DashboardFilters = ({ filters, onFilterChange, options, loading }) => {
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showAssociateDropdown, setShowAssociateDropdown] = useState(false);
  
  const clientDropdownRef = useRef(null);
  const projectDropdownRef = useRef(null);
  const associateDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false);
      }
      if (associateDropdownRef.current && !associateDropdownRef.current.contains(event.target)) {
        setShowAssociateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const handleDateRangeChange = (value) => {
    if (value !== 'custom') {
      const today = new Date();
      let startDate, endDate = today;

      switch (value) {
        case 'today':
          startDate = today;
          break;
        case 'week':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(today.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
          endDate = null;
      }

      onFilterChange({
        dateRange: value,
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: endDate ? endDate.toISOString().split('T')[0] : null
      });
    } else {
      onFilterChange({ dateRange: value });
    }
  };

  const handleMultiSelectChange = (field, id) => {
    const currentSelection = filters[field] || [];
    const newSelection = currentSelection.includes(id)
      ? currentSelection.filter(item => item !== id)
      : [...currentSelection, id];
    
    onFilterChange({ [field]: newSelection });
  };

  const getSelectedCount = (field) => {
    return filters[field]?.length || 0;
  };

  const MultiSelectDropdown = ({ 
    field, 
    options, 
    show, 
    setShow, 
    ref, 
    placeholder 
  }) => (
    <div className="multi-select" ref={ref}>
      <div 
        className="filter-input multi-select-trigger"
        onClick={() => setShow(!show)}
      >
        <span>
          {getSelectedCount(field) > 0 
            ? `${getSelectedCount(field)} selected` 
            : placeholder}
        </span>
        <FaChevronDown className={`chevron ${show ? 'up' : ''}`} />
      </div>
      {show && (
        <div className="multi-select-dropdown">
          {options.map(option => (
            <div
              key={option._id || option.id}
              className={`multi-select-option ${
                filters[field]?.includes(option._id || option.id) ? 'selected' : ''
              }`}
              onClick={() => handleMultiSelectChange(field, option._id || option.id)}
            >
              <input
                type="checkbox"
                checked={filters[field]?.includes(option._id || option.id) || false}
                onChange={() => {}}
              />
              <span>{option.name || option.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-filters">
      <div className="filters-grid">
        <div className="filter-group">
          <label>
            <FaCalendarAlt /> Date Range
          </label>
          <select
            className="filter-select"
            value={filters.dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            disabled={loading}
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {filters.dateRange === 'custom' && (
          <>
            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                className="filter-input"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange({ startDate: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                className="filter-input"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange({ endDate: e.target.value })}
                disabled={loading}
                min={filters.startDate}
              />
            </div>
          </>
        )}

        <div className="filter-group">
          <label>Clients</label>
          <MultiSelectDropdown
            field="clientIds"
            options={options.clients}
            show={showClientDropdown}
            setShow={setShowClientDropdown}
            ref={clientDropdownRef}
            placeholder="Select clients..."
          />
        </div>

        <div className="filter-group">
          <label>Projects</label>
          <MultiSelectDropdown
            field="projectIds"
            options={options.projects}
            show={showProjectDropdown}
            setShow={setShowProjectDropdown}
            ref={projectDropdownRef}
            placeholder="Select projects..."
          />
        </div>

        <div className="filter-group">
          <label>Associates</label>
          <MultiSelectDropdown
            field="associateIds"
            options={options.associates}
            show={showAssociateDropdown}
            setShow={setShowAssociateDropdown}
            ref={associateDropdownRef}
            placeholder="Select associates..."
          />
        </div>

        <div className="filter-group">
          <label>
            <FaFilter /> Status
          </label>
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            disabled={loading}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>&nbsp;</label>
          <button
            className="btn btn-secondary"
            onClick={() => onFilterChange({
              dateRange: 'month',
              startDate: null,
              endDate: null,
              clientIds: [],
              projectIds: [],
              associateIds: [],
              status: 'all'
            })}
            disabled={loading}
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;