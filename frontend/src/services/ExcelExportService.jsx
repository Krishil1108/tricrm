// Dynamic import for XLSX - loads only when needed (7.2MB saved from initial bundle)
import { yieldToMain } from '../utils/exportWorker';

class ExcelExportService {
  /**
   * Export clients data to Excel
   * @param {Array} clients - Array of client objects
   * @param {Object} filters - Applied filters
   * @param {string} filename - Optional filename
   */
  static async exportClientsToExcel(clients, filters = {}, filename = null) {
    try {
      await yieldToMain();
      // Dynamic import - only load XLSX when export is triggered
      const XLSX = await import('xlsx');

      // Prepare the data for export
      const exportData = clients.map((client, index) => ({
        'Name': client.name || '',
        'Email': client.email || '',
        'Phone': client.phone || '',
        'Company': client.company || '',
        'Address': client.address || '',
        'Status': client.status || '',
        'Date Added': client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-IN') : '',
        'Notes': client.notes || ''
      }));

      await yieldToMain();

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
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

      await yieldToMain();

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