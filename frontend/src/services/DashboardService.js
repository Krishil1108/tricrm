import ClientService from './ClientService';
import ReportsExportService from './ReportsExportService';
import API_BASE_URL from '../config/api';

class DashboardService {
  
  // Get client analytics data
  static async getClientAnalytics(dateRange, filters) {
    try {
      // Fetch all clients (ClientService doesn't support server-side filtering yet)
      const clients = await ClientService.getAllClients();
      
      // Filter clients based on date range and filters
      const filteredClients = this.filterClientsByDateAndFilters(clients, dateRange, filters);
      
      // Process data for analytics
      const analytics = this.processClientAnalytics(filteredClients, dateRange);
      
      return analytics;
    } catch (error) {
      console.error('Error fetching client analytics:', error);
      // Return empty analytics structure on error
      return {
        totalClients: 0,
        activeClients: 0,
        inactiveClients: 0,
        pendingClients: 0,
        newClientsThisMonth: 0,
        growthRate: '0%',
        mostCommonType: 'Unknown',
        timeline: [],
        typeDistribution: [],
        histogram: []
      };
    }
  }

  // Stub for removed inventory analytics
  static async getInventoryAnalytics(dateRange, filters) {
    return {
      totalItems: 0,
      totalValue: 0,
      inStockItems: 0,
      outOfStockItems: 0,
      lowStockItems: 0,
      topCategory: 'N/A',
      timeline: [],
      stockStatus: [],
      categoryDistribution: [],
      valueDistribution: []
    };
  }

  // Get associate analytics data
  static async getAssociateAnalytics(dateRange, filters) {
    try {
      const response = await fetch(`${API_BASE_URL}/associates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch associates');
      }

      const result = await response.json();
      const associates = result.data || [];

      // Show all associates (date range filtering removed to show current state)
      // Date range can be used for filtering associated transactions/activities in future
      
      // Calculate total projects
      const totalProjects = associates.reduce((sum, associate) => sum + (associate.projectCount || 0), 0);

      return {
        totalAssociates: associates.length,
        totalProjects: totalProjects,
        associates: associates,
        avgProjectsPerAssociate: associates.length > 0 ? (totalProjects / associates.length).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error fetching associate analytics:', error);
      return {
        totalAssociates: 0,
        totalProjects: 0,
        associates: [],
        avgProjectsPerAssociate: 0
      };
    }
  }

  // Get project analytics data
  static async getProjectAnalytics(dateRange, filters) {
    try {
      const response = await fetch(`${API_BASE_URL}/finance/projects`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const result = await response.json();
      const projects = result.data || [];

      // Show all projects (date range filtering removed to show current state)
      // Date range can be used for filtering project activities/milestones in future
      
      // Calculate status breakdown
      const statusBreakdown = projects.reduce((acc, project) => {
        const status = project.status || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      return {
        totalProjects: projects.length,
        projects: projects,
        statusBreakdown: statusBreakdown
      };
    } catch (error) {
      console.error('Error fetching project analytics:', error);
      return {
        totalProjects: 0,
        projects: [],
        statusBreakdown: {}
      };
    }
  }
  
  // Filter clients by date range and additional filters
  static filterClientsByDateAndFilters(clients, dateRange, filters) {
    if (!Array.isArray(clients)) return [];
    
    return clients.filter(client => {
      // Date filter
      const clientDate = new Date(client.createdAt || client.dateJoined || new Date());
      const isInDateRange = clientDate >= dateRange.startDate && clientDate <= dateRange.endDate;
      
      if (!isInDateRange) return false;
      
      // Type filter
      if (filters.type !== 'all' && client.type !== filters.type) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && client.status !== filters.status) {
        return false;
      }
      
      return true;
    });
  }
  
  // Filter inventory by date range only (when server-side filtering is already applied)
  static filterInventoryByDateRange(inventory, dateRange) {
    if (!Array.isArray(inventory)) return [];
    
    return inventory.filter(item => {
      const itemDate = new Date(item.createdAt || item.dateAdded || new Date());
      return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
    });
  }

  // Filter inventory by date range and additional filters (fallback method)
  static filterInventoryByDateAndFilters(inventory, dateRange, filters) {
    if (!Array.isArray(inventory)) return [];
    
    return inventory.filter(item => {
      // Date filter
      const itemDate = new Date(item.createdAt || item.dateAdded || new Date());
      const isInDateRange = itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
      
      if (!isInDateRange) return false;
      
      // Status filter
      if (filters.status !== 'all') {
        const itemStatus = this.getInventoryStatus(item);
        if (itemStatus !== filters.status) {
          return false;
        }
      }
      
      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      
      return true;
    });
  }
  
  // Determine inventory item status
  static getInventoryStatus(item) {
    const quantity = item.quantity || 0;
    const minQuantity = item.minQuantity || 10;
    
    if (quantity === 0) return 'outOfStock';
    if (quantity <= minQuantity) return 'lowStock';
    return 'inStock';
  }
  
  // Process client data for analytics
  static processClientAnalytics(clients, dateRange) {
    // Ensure clients is an array
    const clientsArray = Array.isArray(clients) ? clients : [];
    
    const analytics = {
      totalClients: clientsArray.length,
      activeClients: clientsArray.filter(c => c.status === 'active').length,
      inactiveClients: clientsArray.filter(c => c.status === 'inactive').length,
      pendingClients: clientsArray.filter(c => c.status === 'pending').length,
      newClientsThisMonth: this.getNewClientsThisMonth(clientsArray),
      growthRate: this.calculateGrowthRate(clientsArray),
      mostCommonType: this.getMostCommonClientType(clientsArray),
      timeline: this.generateClientTimeline(clientsArray, dateRange),
      typeDistribution: this.getClientTypeDistribution(clientsArray),
      histogram: this.generateClientHistogram(clientsArray)
    };
    
    return analytics;
  }
  
  // Process inventory data for analytics
  static processInventoryAnalytics(inventory, dateRange) {
    // Ensure inventory is an array
    const inventoryArray = Array.isArray(inventory) ? inventory : [];
    
    const totalValue = inventoryArray.reduce((sum, item) => sum + (item.totalValue || item.price * item.quantity || 0), 0);
    const inStockItems = inventoryArray.filter(item => this.getInventoryStatus(item) === 'inStock').length;
    const outOfStockItems = inventoryArray.filter(item => this.getInventoryStatus(item) === 'outOfStock').length;
    const lowStockItems = inventoryArray.filter(item => this.getInventoryStatus(item) === 'lowStock').length;
    
    const analytics = {
      totalItems: inventoryArray.length,
      totalValue: totalValue,
      inStockItems: inStockItems,
      outOfStockItems: outOfStockItems,
      lowStockItems: lowStockItems,
      topCategory: this.getTopInventoryCategory(inventoryArray),
      timeline: this.generateInventoryTimeline(inventoryArray, dateRange),
      stockStatus: this.getInventoryStatusDistribution(inventoryArray),
      categoryDistribution: this.getInventoryCategoryDistribution(inventoryArray),
      valueDistribution: this.generateInventoryValueHistogram(inventoryArray)
    };
    
    return analytics;
  }
  
  // Helper methods for client analytics
  static getNewClientsThisMonth(clients) {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return clients.filter(client => {
      const clientDate = new Date(client.createdAt || client.dateJoined || new Date());
      return clientDate >= firstOfMonth;
    }).length;
  }
  
  static calculateGrowthRate(clients) {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    const currentYearClients = clients.filter(client => {
      const year = new Date(client.createdAt || client.dateJoined || new Date()).getFullYear();
      return year === currentYear;
    }).length;
    
    const lastYearClients = clients.filter(client => {
      const year = new Date(client.createdAt || client.dateJoined || new Date()).getFullYear();
      return year === lastYear;
    }).length;
    
    if (lastYearClients === 0) return currentYearClients > 0 ? '100%' : '0%';
    
    const growthRate = ((currentYearClients - lastYearClients) / lastYearClients) * 100;
    return `${growthRate.toFixed(1)}%`;
  }
  
  static getMostCommonClientType(clients) {
    if (!clients || clients.length === 0) return 'No data';
    
    const typeCounts = clients.reduce((acc, client) => {
      const type = client.type || client.category || 'Individual';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    if (Object.keys(typeCounts).length === 0) return 'No data';
    
    return Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b);
  }
  
  static generateClientTimeline(clients, dateRange) {
    const timeline = [];
    const currentYear = new Date().getFullYear();
    const startYear = dateRange.startDate.getFullYear();
    const endYear = Math.min(dateRange.endDate.getFullYear(), currentYear); // Don't go beyond current year
    
    // Ensure we have at least a 3-year range for meaningful chart display, but not into the future
    const minStartYear = Math.min(startYear, endYear - 2);
    const maxEndYear = Math.min(Math.max(endYear, startYear + 2), currentYear); // Cap at current year
    
    // Generate cumulative client count by year
    let cumulativeCount = 0;
    
    for (let year = minStartYear; year <= maxEndYear; year++) {
      const yearClients = clients.filter(client => {
        const clientYear = new Date(client.createdAt || client.dateJoined || new Date()).getFullYear();
        return clientYear === year;
      });
      
      cumulativeCount += yearClients.length;
      
      timeline.push({
        date: new Date(year, 0, 1),
        clients: cumulativeCount, // Show cumulative growth
        newClients: yearClients.length, // Show new clients for that year
        count: cumulativeCount,
        year: year
      });
    }
    
    return timeline;
  }
  
  static getClientTypeDistribution(clients) {
    const distribution = clients.reduce((acc, client) => {
      const type = client.type || 'Unknown';
      const existingType = acc.find(item => item.name === type);
      
      if (existingType) {
        existingType.count++;
      } else {
        acc.push({ name: type, count: 1 });
      }
      
      return acc;
    }, []);
    
    return distribution;
  }
  
  static generateClientHistogram(clients) {
    const ranges = [
      { range: '0-10', min: 0, max: 10 },
      { range: '11-25', min: 11, max: 25 },
      { range: '26-50', min: 26, max: 50 },
      { range: '51-100', min: 51, max: 100 },
      { range: '100+', min: 101, max: Infinity }
    ];
    
    return ranges.map(range => ({
      range: range.range,
      count: clients.filter(client => {
        const clientCount = clients.length; // This is a simple example
        return clientCount >= range.min && clientCount <= range.max;
      }).length
    }));
  }
  
  // Helper methods for inventory analytics
  static getTopInventoryCategory(inventory) {
    if (!inventory || inventory.length === 0) return 'No data';
    
    const categoryCounts = inventory.reduce((acc, item) => {
      const category = item.category || item.categoryType || 'General';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    if (Object.keys(categoryCounts).length === 0) return 'No data';
    
    return Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b);
  }
  
  static generateInventoryTimeline(inventory, dateRange) {
    const timeline = [];
    const currentYear = new Date().getFullYear();
    const startYear = dateRange.startDate.getFullYear();
    const endYear = Math.min(dateRange.endDate.getFullYear(), currentYear); // Don't go beyond current year
    
    // Ensure we have at least a 3-year range for meaningful chart display, but not into the future
    const minStartYear = Math.min(startYear, endYear - 2);
    const maxEndYear = Math.min(Math.max(endYear, startYear + 2), currentYear); // Cap at current year
    
    for (let year = minStartYear; year <= maxEndYear; year++) {
      const yearInventory = inventory.filter(item => {
        const itemYear = new Date(item.createdAt || item.dateAdded || new Date()).getFullYear();
        return itemYear <= year; // Cumulative count
      });
      
      const totalValue = yearInventory.reduce((sum, item) => sum + (item.totalValue || item.price * item.quantity || 0), 0);
      const inStock = yearInventory.filter(item => this.getInventoryStatus(item) === 'inStock').length;
      const outOfStock = yearInventory.filter(item => this.getInventoryStatus(item) === 'outOfStock').length;
      const lowStock = yearInventory.filter(item => this.getInventoryStatus(item) === 'lowStock').length;
      
      timeline.push({
        date: new Date(year, 0, 1),
        totalItems: yearInventory.length,
        totalValue: totalValue,
        inStock: inStock,
        outOfStock: outOfStock,
        lowStock: lowStock,
        year: year
      });
    }
    
    return timeline;
  }
  
  static getInventoryStatusDistribution(inventory) {
    const distribution = [
      { status: 'In Stock', count: 0 },
      { status: 'Out of Stock', count: 0 },
      { status: 'Low Stock', count: 0 }
    ];
    
    // Ensure inventory is an array and handle empty arrays
    const inventoryArray = Array.isArray(inventory) ? inventory : [];
    
    inventoryArray.forEach(item => {
      const status = this.getInventoryStatus(item);
      let statusItem;
      
      switch(status) {
        case 'inStock':
          statusItem = distribution.find(d => d.status === 'In Stock');
          break;
        case 'outOfStock':
          statusItem = distribution.find(d => d.status === 'Out of Stock');
          break;
        case 'lowStock':
          statusItem = distribution.find(d => d.status === 'Low Stock');
          break;
      }
      
      if (statusItem) {
        statusItem.count++;
      }
    });
    
    return distribution;
  }
  
  static getInventoryCategoryDistribution(inventory) {
    const distribution = inventory.reduce((acc, item) => {
      const category = item.category || 'Unknown';
      const existingCategory = acc.find(cat => cat.category === category);
      
      if (existingCategory) {
        existingCategory.count++;
        existingCategory.totalValue += item.totalValue || item.price * item.quantity || 0;
      } else {
        acc.push({
          category: category,
          count: 1,
          totalValue: item.totalValue || item.price * item.quantity || 0
        });
      }
      
      return acc;
    }, []);
    
    return distribution;
  }
  
  static generateInventoryValueHistogram(inventory) {
    const ranges = [
      { range: '₹0-1K', min: 0, max: 1000 },
      { range: '₹1K-5K', min: 1000, max: 5000 },
      { range: '₹5K-10K', min: 5000, max: 10000 },
      { range: '₹10K-50K', min: 10000, max: 50000 },
      { range: '₹50K+', min: 50000, max: Infinity }
    ];
    
    return ranges.map(range => {
      const itemsInRange = inventory.filter(item => {
        const value = item.totalValue || item.price * item.quantity || 0;
        return value >= range.min && value < range.max;
      });
      
      return {
        range: range.range,
        count: itemsInRange.length,
        totalValue: itemsInRange.reduce((sum, item) => sum + (item.totalValue || item.price * item.quantity || 0), 0)
      };
    });
  }
  
  // Export reports functionality
  static async exportReports(exportData, dateRange, format) {
    try {
      const filename = `${exportData.type}_analytics_${dateRange.startDate.toISOString().split('T')[0]}_to_${dateRange.endDate.toISOString().split('T')[0]}`;
      
      if (format === 'excel') {
        await ReportsExportService.exportToExcel(exportData, filename);
      } else if (format === 'csv') {
        await ReportsExportService.exportToCSV(exportData, filename);
      }
    } catch (error) {
      console.error('Error exporting reports:', error);
      throw error;
    }
  }
}

export default DashboardService;