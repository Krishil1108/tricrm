import * as XLSX from 'xlsx';

class ExcelExportService {
  /**
   * Export clients data to Excel
   * @param {Array} clients - Array of client objects
   * @param {Object} filters - Applied filters
   * @param {string} filename - Optional filename
   */
  static exportClientsToExcel(clients, filters = {}, filename = null) {
    try {
      // Prepare the data for export
      const exportData = clients.map((client, index) => ({
        'S.No': index + 1,
        'Name': client.name || '',
        'Email': client.email || '',
        'Phone': client.phone || '',
        'Company': client.company || '',
        'Address': client.address || '',
        'Status': client.status || '',
        'Date Added': client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-IN') : '',
        'Notes': client.notes || ''
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 8 },  // S.No
        { wch: 20 }, // Name
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 20 }, // Company
        { wch: 30 }, // Address
        { wch: 12 }, // Status
        { wch: 15 }, // Date Added
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

      // Add metadata sheet
      const metadata = [
        { 'Export Information': 'Value' },
        { 'Export Information': 'Export Date', 'Value': new Date().toLocaleString('en-IN') },
        { 'Export Information': 'Total Records', 'Value': clients.length },
        { 'Export Information': 'Search Filter', 'Value': filters.searchTerm || 'None' },
        { 'Export Information': 'Status Filter', 'Value': filters.filterStatus || 'All' },
        { 'Export Information': 'Sort By', 'Value': filters.sortBy || 'Name' }
      ];
      
      const metaWorksheet = XLSX.utils.json_to_sheet(metadata);
      XLSX.utils.book_append_sheet(workbook, metaWorksheet, 'Export Info');

      // Generate filename
      const defaultFilename = `clients_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const finalFilename = filename || defaultFilename;

      // Save the file
      XLSX.writeFile(workbook, finalFilename);

      return {
        success: true,
        message: `Successfully exported ${clients.length} clients to ${finalFilename}`,
        filename: finalFilename
      };
    } catch (error) {
      console.error('Error exporting clients to Excel:', error);
      return {
        success: false,
        message: 'Failed to export clients to Excel',
        error: error.message
      };
    }
  }

  /**
   * Export inventory data to Excel
   * @param {Array} inventory - Array of inventory objects
   * @param {Object} filters - Applied filters
   * @param {string} filename - Optional filename
   */
  static exportInventoryToExcel(inventory, filters = {}, filename = null) {
    try {
      // Format currency for Excel
      const formatCurrency = (amount) => {
        return parseFloat(amount || 0);
      };

      // Prepare the data for export
      const exportData = inventory.map((item, index) => ({
        'S.No': index + 1,
        'Item Name': item.name || '',
        'Category': item.category || '',
        'SKU': item.sku || '',
        'Description': item.description || '',
        'Quantity': item.quantity || 0,
        'Unit Price (₹)': formatCurrency(item.unitPrice),
        'Total Value (₹)': formatCurrency(item.totalValue),
        'Supplier': item.supplier || '',
        'Location': item.location || '',
        'Status': item.status || '',
        'Reorder Level': item.reorderLevel || 0,
        'Date Added': item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '',
        'Last Updated': item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString('en-IN') : '',
        'Notes': item.notes || ''
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 8 },  // S.No
        { wch: 25 }, // Item Name
        { wch: 15 }, // Category
        { wch: 15 }, // SKU
        { wch: 30 }, // Description
        { wch: 10 }, // Quantity
        { wch: 15 }, // Unit Price
        { wch: 15 }, // Total Value
        { wch: 20 }, // Supplier
        { wch: 15 }, // Location
        { wch: 12 }, // Status
        { wch: 12 }, // Reorder Level
        { wch: 15 }, // Date Added
        { wch: 15 }, // Last Updated
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

      // Add summary sheet
      const totalValue = inventory.reduce((sum, item) => sum + (item.totalValue || 0), 0);
      const totalQuantity = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const statusCounts = inventory.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      const summary = [
        { 'Summary': 'Metric', 'Value': 'Count/Amount' },
        { 'Summary': 'Total Items', 'Value': inventory.length },
        { 'Summary': 'Total Quantity', 'Value': totalQuantity },
        { 'Summary': 'Total Value (₹)', 'Value': totalValue },
        { 'Summary': 'In Stock', 'Value': statusCounts['In Stock'] || 0 },
        { 'Summary': 'Low Stock', 'Value': statusCounts['Low Stock'] || 0 },
        { 'Summary': 'Out of Stock', 'Value': statusCounts['Out of Stock'] || 0 },
        { 'Summary': 'Discontinued', 'Value': statusCounts['Discontinued'] || 0 }
      ];

      const summaryWorksheet = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

      // Add metadata sheet
      const metadata = [
        { 'Export Information': 'Value' },
        { 'Export Information': 'Export Date', 'Value': new Date().toLocaleString('en-IN') },
        { 'Export Information': 'Total Records', 'Value': inventory.length },
        { 'Export Information': 'Search Filter', 'Value': filters.searchTerm || 'None' },
        { 'Export Information': 'Category Filter', 'Value': filters.filterCategory || 'All' },
        { 'Export Information': 'Status Filter', 'Value': filters.filterStatus || 'All' },
        { 'Export Information': 'Date Range', 'Value': filters.dateRange || 'All Time' },
        { 'Export Information': 'Sort By', 'Value': filters.sortBy || 'Name' }
      ];
      
      const metaWorksheet = XLSX.utils.json_to_sheet(metadata);
      XLSX.utils.book_append_sheet(workbook, metaWorksheet, 'Export Info');

      // Generate filename
      const defaultFilename = `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      const finalFilename = filename || defaultFilename;

      // Save the file
      XLSX.writeFile(workbook, finalFilename);

      return {
        success: true,
        message: `Successfully exported ${inventory.length} inventory items to ${finalFilename}`,
        filename: finalFilename
      };
    } catch (error) {
      console.error('Error exporting inventory to Excel:', error);
      return {
        success: false,
        message: 'Failed to export inventory to Excel',
        error: error.message
      };
    }
  }

  /**
   * Filter data by date range
   * @param {Array} data - Array of data objects
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} dateField - Field name to filter by (default: 'createdAt')
   * @returns {Array} Filtered data
   */
  static filterByDateRange(data, startDate, endDate, dateField = 'createdAt') {
    if (!startDate && !endDate) return data;

    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      
      // Set end date to end of day
      end.setHours(23, 59, 59, 999);
      
      return itemDate >= start && itemDate <= end;
    });
  }

  /**
   * Generate filename with filters applied
   * @param {string} baseType - 'clients' or 'inventory'
   * @param {Object} filters - Applied filters
   * @returns {string} Generated filename
   */
  static generateFilename(baseType, filters = {}) {
    const date = new Date().toISOString().split('T')[0];
    let filename = `${baseType}_export_${date}`;

    if (filters.filterStatus && filters.filterStatus !== 'all') {
      filename += `_${filters.filterStatus.toLowerCase().replace(' ', '_')}`;
    }

    if (filters.filterCategory && filters.filterCategory !== 'all') {
      filename += `_${filters.filterCategory.toLowerCase().replace(' ', '_')}`;
    }

    if (filters.dateRange) {
      filename += `_${filters.dateRange}`;
    }

    return `${filename}.xlsx`;
  }
}

export default ExcelExportService;