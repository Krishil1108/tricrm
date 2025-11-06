import React, { useState, useEffect } from 'react';
import FilterPanel from './components/dashboard/FilterPanel';
import ReportsPanel from './components/dashboard/ReportsPanel';
import DashboardService from './services/DashboardService';
import './PageContent.css';
import './DashboardPage.css';

const DashboardPage = () => {
  // Filter state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    endDate: new Date()
  });
  const [graphType, setGraphType] = useState('line');
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' or 'inventory'
  const [clientFilters, setClientFilters] = useState({
    type: 'all',
    status: 'all'
  });
  const [inventoryFilters, setInventoryFilters] = useState({
    status: 'all', // 'all', 'inStock', 'outOfStock', 'lowStock'
    category: 'all'
  });

  // Data state
  const [clientData, setClientData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load data on component mount and when filters change
  useEffect(() => {
    loadDashboardData();
  }, [dateRange, clientFilters, inventoryFilters]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [clients, inventory] = await Promise.all([
        DashboardService.getClientAnalytics(dateRange, clientFilters),
        DashboardService.getInventoryAnalytics(dateRange, inventoryFilters)
      ]);
      
      setClientData(clients);
      setInventoryData(inventory);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  const handleGraphTypeChange = (newGraphType) => {
    setGraphType(newGraphType);
  };

  const handleClientFiltersChange = (newFilters) => {
    setClientFilters(newFilters);
  };

  const handleInventoryFiltersChange = (newFilters) => {
    setInventoryFilters(newFilters);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleExport = async (format) => {
    try {
      setLoading(true);
      
      const exportData = activeTab === 'clients' 
        ? { type: 'clients', data: clientData, filters: clientFilters }
        : { type: 'inventory', data: inventoryData, filters: inventoryFilters };
      
      await DashboardService.exportReports(exportData, dateRange, format);
      
      // Show success message (you can implement a toast notification here)
      console.log(`Data exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      setError(`Failed to export data: ${err.message}`);
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container dashboard-page-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Dashboard & Analytics</h1>
          <p>Comprehensive insights into your clients and inventory performance</p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Left Panel - Filters & Controls */}
        <div className="dashboard-left-panel">
          <FilterPanel
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            graphType={graphType}
            onGraphTypeChange={handleGraphTypeChange}
            activeTab={activeTab}
            clientFilters={clientFilters}
            onClientFiltersChange={handleClientFiltersChange}
            inventoryFilters={inventoryFilters}
            onInventoryFiltersChange={handleInventoryFiltersChange}
            onExport={handleExport}
            loading={loading}
          />
        </div>

        {/* Right Panel - Graphs & Reports */}
        <div className="dashboard-right-panel">
          <ReportsPanel
            activeTab={activeTab}
            onTabChange={handleTabChange}
            graphType={graphType}
            clientData={clientData}
            inventoryData={inventoryData}
            dateRange={dateRange}
            clientFilters={clientFilters}
            inventoryFilters={inventoryFilters}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;