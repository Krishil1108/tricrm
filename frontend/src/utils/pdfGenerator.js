import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Professional PDF Generator for Window Quotations
 * This module provides a clean, modular PDF generation functionality
 * that captures the current state of quotation data without interfering
 * with the existing UI or data flow.
 */

class QuotationPDFGenerator {
  constructor() {
    this.pdf = null;
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 25.4; // 1 inch margins on all sides (25.4mm)
    this.currentY = this.margin;
    this.lineHeight = 7;
    this.lineSpacing = 1.3; // 1.3x line spacing for better readability
    this.sectionGap = 12; // Gap between major sections
    this.footerHeight = 20; // Reserve space for footer
    this.headerHeight = 30; // Reserve space for header on continuation pages
    this.quotationData = null; // Store quotation data for headers
    this.colors = {
      primary: [26, 82, 118], // Professional dark blue
      secondary: [41, 128, 185], // Medium blue
      accent: [231, 76, 60], // Red for highlights
      text: [44, 62, 80], // Dark gray for text
      lightGray: [245, 245, 245], // Very light gray for backgrounds
      borderGray: [220, 220, 220], // Light gray for borders
      white: [255, 255, 255],
      gold: [218, 165, 32] // Gold for premium look
    };
  }

  /**
   * Main function to generate PDF from quotation data
   * @param {Object} quotationData - The quotation data object
   * @param {Array} quotationData.windowSpecs - Array of window specifications
   * @param {Object} quotationData.clientDetails - Client information
   * @param {Object} quotationData.companyDetails - Company information
   */
  async generatePDF(quotationData) {
    try {
      this.pdf = new jsPDF('p', 'mm', 'a4');
      this.currentY = this.margin;
      this.quotationData = quotationData; // Store for access in other methods

      // Generate the PDF content
      this.addHeader(quotationData);
      this.addQuoteInfo(quotationData);
      this.addSectionSpacing('small');
      this.addSectionDivider(); // Visual separator
      this.addSectionSpacing('small');
      this.addClientDetails(quotationData);
      this.addSectionSpacing('small');
      this.addSectionDivider(); // Visual separator
      this.addSectionSpacing('medium');
      this.addIntroduction();
      this.addSectionSpacing('large');
      
      // Add window specifications with proper page management
      for (let i = 0; i < quotationData.windowSpecs.length; i++) {
        // Check if we need a new page for this specification
        if (i > 0) {
          this.ensureSpace(120); // Ensure space for specification or create new page
        }
        await this.addWindowSpecification(quotationData.windowSpecs[i], i);
        this.addSectionSpacing('medium');
      }

      // Add totals section with proper spacing
      this.ensureSpace(100); // Ensure space for totals section
      this.addQuoteTotals(quotationData);
      this.addSectionSpacing('large');
      this.addTermsAndConditions();
      
      // Add page numbers to all pages
      this.addPageNumbers();
      
      // Save the PDF
      const fileName = `Quotation_${quotationData.quotationNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      this.pdf.save(fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if content will fit on current page, if not create new page with header
   * @param {number} requiredHeight - Height needed for the content
   * @param {boolean} addHeader - Whether to add continuation header on new page
   */
  checkPageBreak(requiredHeight, addHeader = true) {
    const availableHeight = this.pageHeight - this.currentY - this.footerHeight;
    
    if (requiredHeight > availableHeight) {
      this.pdf.addPage();
      this.currentY = this.margin;
      
      if (addHeader) {
        this.addContinuationHeader();
        this.currentY += this.headerHeight;
      }
      
      return true; // New page was created
    }
    return false; // Content fits on current page
  }

  /**
   * Add a simplified header for continuation pages
   */
  addContinuationHeader() {
    const companyDetails = this.quotationData?.companyDetails || {
      name: 'ADS SYSTEMS',
      tagline: 'Finvent Windows & Doors',
      phone: '(561) 123-4567',
      email: 'info@adssystem.com',
      website: 'www.findsys.com'
    };

    // Ensure all values are valid strings
    const companyName = String(companyDetails.name || 'ADS SYSTEMS');
    const companyTagline = String(companyDetails.tagline || 'Finvent Windows & Doors');
    const quotationNumber = String(this.quotationData?.quotationNumber || 'Q/###');

    // Company info box
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 2, 2, 'FD');
    
    // Company name
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(companyName, this.margin + 5, this.currentY + 8);
    
    // Tagline
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(companyTagline, this.margin + 5, this.currentY + 15);
    
    // Contact info (right aligned)
    this.pdf.setFontSize(8);
    const currentDate = new Date().toLocaleDateString('en-IN');
    this.pdf.text(`Quote: ${quotationNumber}`, this.pageWidth - this.margin - 5, this.currentY + 8, { align: 'right' });
    this.pdf.text(`Date: ${currentDate}`, this.pageWidth - this.margin - 5, this.currentY + 15, { align: 'right' });
  }

  /**
   * Add consistent section spacing
   * @param {string} size - 'small', 'medium', 'large'
   */
  addSectionSpacing(size = 'medium') {
    const spacing = {
      small: 5,
      medium: 10,
      large: 15
    };
    this.currentY += spacing[size] || spacing.medium;
  }

  /**
   * Ensure minimum space available, create new page if needed
   * @param {number} minSpace - Minimum space required
   */
  ensureSpace(minSpace) {
    const availableSpace = this.pageHeight - this.currentY - this.footerHeight;
    if (availableSpace < minSpace) {
      this.checkPageBreak(minSpace);
    }
  }

  /**
   * Enhanced method to ensure tables have proper borders and formatting
   * @param {Array} headers - Table headers
   * @param {Array} rows - Table data rows
   * @param {Object} options - Formatting options
   */
  addFormattedTable(headers, rows, options = {}) {
    const startX = options.startX || this.margin;
    const tableWidth = options.width || (this.pageWidth - 2 * this.margin);
    const columnWidth = tableWidth / headers.length;
    const rowHeight = options.rowHeight || 8;
    const headerHeight = options.headerHeight || 10;
    
    // Calculate total required height
    const totalHeight = headerHeight + (rows.length * rowHeight);
    
    // Check if table fits on current page
    this.checkPageBreak(totalHeight + 10);
    
    const startY = this.currentY;
    
    // Draw table header with borders
    this.pdf.setFillColor(245, 245, 245); // Light gray background
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(startX, startY, tableWidth, headerHeight, 'FD');
    
    // Header text
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    
    headers.forEach((header, index) => {
      const cellX = startX + (index * columnWidth);
      // Vertical lines between columns
      if (index > 0) {
        this.pdf.line(cellX, startY, cellX, startY + headerHeight);
      }
      this.pdf.text(header, cellX + 2, startY + 6);
    });
    
    // Draw table rows with borders
    this.pdf.setFillColor(255, 255, 255); // White background
    rows.forEach((row, rowIndex) => {
      const rowY = startY + headerHeight + (rowIndex * rowHeight);
      
      // Row background and border
      this.pdf.rect(startX, rowY, tableWidth, rowHeight, 'FD');
      
      // Row text
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');
      
      row.forEach((cell, cellIndex) => {
        const cellX = startX + (cellIndex * columnWidth);
        // Vertical lines between columns
        if (cellIndex > 0) {
          this.pdf.line(cellX, rowY, cellX, rowY + rowHeight);
        }
        this.pdf.text(String(cell), cellX + 2, rowY + 5);
      });
    });
    
    this.currentY = startY + totalHeight + 5;
  }

  /**
   * Add professional header with company branding
   */
  addHeader(quotationData) {
    // Safety check - use stored quotationData if not provided
    if (!quotationData) {
      quotationData = this.quotationData || {};
    }
    
    const companyDetails = quotationData?.companyDetails || {
      name: 'ADS SYSTEMS',
      phone: '9574544012',
      email: 'support@adssystem.co.in',
      website: 'adssystem.co.in',
      gstin: '24APJPP8011N1ZK'
    };
    
    // Header background with gradient effect (simulated with two rectangles)
    this.pdf.setFillColor(...this.colors.primary);
    this.pdf.rect(0, 0, this.pageWidth, 35, 'F');
    
    // Gold accent bar at top
    this.pdf.setFillColor(...this.colors.gold);
    this.pdf.rect(0, 0, this.pageWidth, 2, 'F');
    
    // Company Logo Area (left side)
    this.pdf.setFillColor(...this.colors.white);
    this.pdf.rect(this.margin - 5, 8, 45, 20, 'F');
    
    // ADS Logo Text
    this.pdf.setTextColor(...this.colors.primary);
    this.pdf.setFontSize(28);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('ADS', this.margin, 18);
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('SYSTEMS', this.margin, 24);
    
    // Main Title (center-right area)
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Finvent Windows & Doors', this.margin + 50, 13);
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Quotation System', this.margin + 50, 20);
    
    // Contact details (right side) - using ASCII-safe text labels
    this.pdf.setFontSize(8);
    const rightX = this.pageWidth - this.margin;
    this.pdf.text(`Phone: ${companyDetails.phone || 'N/A'}`, rightX, 10, { align: 'right' });
    this.pdf.text(`Email: ${companyDetails.email || 'N/A'}`, rightX, 15, { align: 'right' });
    this.pdf.text(`Web: ${companyDetails.website || 'N/A'}`, rightX, 20, { align: 'right' });
    this.pdf.text(`GSTIN: ${companyDetails.gstin || 'N/A'}`, rightX, 25, { align: 'right' });
    
    // Bottom border line
    this.pdf.setDrawColor(...this.colors.gold);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, 35, this.pageWidth - this.margin, 35);
    
    this.currentY = 42;
  }

  /**
   * Add quotation information line
   */
  addQuoteInfo(quotationData) {
    // Safety check
    if (!quotationData) {
      quotationData = this.quotationData || {};
    }
    
    // Info box with border
    this.pdf.setDrawColor(...this.colors.borderGray);
    this.pdf.setLineWidth(0.3);
    this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 2, 2, 'S');
    
    // Background
    this.pdf.setFillColor(...this.colors.lightGray);
    this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 2, 2, 'F');
    
    this.pdf.setTextColor(...this.colors.text);
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    
    // Three column layout
    const col1X = this.margin + 5;
    const col2X = this.margin + 65;
    const col3X = this.margin + 125;
    
    this.pdf.text('Quote No:', col1X, this.currentY + 4);
    this.pdf.text('Project:', col2X, this.currentY + 4);
    this.pdf.text('Date:', col3X, this.currentY + 4);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(String(quotationData.quotationNumber || 'N/A'), col1X, this.currentY + 9);
    this.pdf.text(String(quotationData.project || 'N/A'), col2X, this.currentY + 9);
    this.pdf.text(String(quotationData.date || 'N/A'), col3X, this.currentY + 9);
    
    this.currentY += 17;
  }

  /**
   * Add client details section
   */
  addClientDetails(quotationData) {
    // Safety check
    if (!quotationData) {
      quotationData = this.quotationData || {};
    }
    
    const clientDetails = quotationData?.clientDetails || {};
    
    // Section header
    this.pdf.setFillColor(...this.colors.secondary);
    this.pdf.rect(this.margin, this.currentY, 30, 6, 'F');
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('To:', this.margin + 3, this.currentY + 4.5);
    
    this.currentY += 8;
    
    // Client info box
    this.pdf.setDrawColor(...this.colors.borderGray);
    this.pdf.setLineWidth(0.3);
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...this.colors.text);
    
    if (clientDetails.name) {
      this.pdf.text(String(clientDetails.name), this.margin + 3, this.currentY);
      this.currentY += 6;
    }
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    
    if (clientDetails.address) {
      const addressLines = String(clientDetails.address).split('\n');
      addressLines.forEach(line => {
        if (line.trim()) {
          this.pdf.text(line.trim(), this.margin + 3, this.currentY);
          this.currentY += 5;
        }
      });
    }
    
    this.currentY += 3;
  }

  /**
   * Add introduction text with enhanced formatting and professional structure
   */
  addIntroduction() {
    // Professional header section
    this.pdf.setFillColor(41, 128, 185); // Blue header only
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 'F');
    
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('PROPOSAL OVERVIEW', this.margin + 4, this.currentY + 5.5);
    
    this.currentY += 12;
    
    // Greeting section
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(44, 62, 80);
    
    this.pdf.text('Dear Valued Client,', this.margin, this.currentY);
    this.currentY += 8;
    
    // Main description with improved formatting
    const mainDescription = [
      'We are delighted to present our comprehensive range of premium Windows and Doors',
      'designed specifically for your project requirements. Our products have gained rapid',
      'acceptance across India for their superior protection against noise, heat, rain, dust,',
      'and environmental pollution.'
    ];
    
    // Render main description with justified text
    this.pdf.setFontSize(9.5);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(60, 60, 60);
    
    mainDescription.forEach(line => {
      const maxWidth = this.pageWidth - 2 * this.margin;
      const wrappedLines = this.pdf.splitTextToSize(line, maxWidth);
      wrappedLines.forEach(wrappedLine => {
        this.pdf.text(wrappedLine, this.margin, this.currentY);
        this.currentY += 5.5;
      });
    });
    
    this.currentY += 6;
    
    // Benefits section with bullet points
    this.pdf.setFillColor(255, 255, 255); // White background
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 35, 'F');
    this.pdf.setDrawColor(0, 0, 0); // Black border
    this.pdf.setLineWidth(0.3);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 35, 'D');
    
    this.currentY += 5;
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(41, 128, 185);
    this.pdf.text('This comprehensive proposal includes:', this.margin + 4, this.currentY);
    
    this.currentY += 8;
    
    const proposalItems = [
      'Complete window design specifications and technical details',
      'Accurate pricing breakdown with transparent calculations',
      'Professional terms and conditions for your peace of mind',
      'Quality assurance and warranty information'
    ];
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(52, 73, 94);
    
    proposalItems.forEach((item, index) => {
      // Enhanced bullet points
      this.pdf.setFillColor(0, 0, 0); // Black bullet points
      this.pdf.circle(this.margin + 8, this.currentY - 1, 1.2, 'F');
      
      // Item text with proper wrapping
      const maxWidth = this.pageWidth - 2 * this.margin - 16;
      const lines = this.pdf.splitTextToSize(item, maxWidth);
      
      lines.forEach((line, lineIndex) => {
        this.pdf.text(line, this.margin + 14, this.currentY + (lineIndex * 5));
      });
      
      this.currentY += Math.max(lines.length * 5, 6);
    });
    
    this.currentY += 8;
    
    // Closing statement
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setTextColor(41, 128, 185);
    this.pdf.text('We look forward to the opportunity to serve you and exceed your expectations.', 
                  this.margin, this.currentY);
    
    this.currentY += 12;
  }

  /**
   * Add window specification with diagram
   */
  async addWindowSpecification(spec, index) {
    // Estimate total height needed for this specification
    const estimatedHeight = 120; // Diagram + tables + spacing
    
    // Check if we need a page break with improved logic
    this.checkPageBreak(estimatedHeight);

    // Section title with professional black and white styling
    this.pdf.setFillColor(245, 245, 245); // Light gray background
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 10, 'FD');
    
    this.pdf.setTextColor(0, 0, 0); // Black text
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    
    // Extract readable name - handle object, string, or undefined
    let windowName = 'Custom Window';
    if (typeof spec.name === 'string' && spec.name.trim()) {
      windowName = spec.name.trim();
    } else if (spec.name && typeof spec.name === 'object') {
      // If name is an object, try to extract meaningful info
      windowName = String(spec.name.location || spec.name.type || 'Custom Window');
    } else if (spec.location && typeof spec.location === 'string') {
      windowName = spec.location.trim();
    } else if (spec.type || spec.selectedWindowType) {
      const type = this.formatWindowType(spec.type || spec.selectedWindowType);
      windowName = String(type || 'Custom Window');
    }
    
    // Ensure windowName is always a valid string
    windowName = String(windowName || 'Custom Window');
    
    this.pdf.text(`Window Specification ${index + 1}: ${windowName}`, this.margin + 8, this.currentY + 7);
    
    this.currentY += 15;

    // New Layout: Left = Diagram Only, Right = Specs + Pricing stacked
    const leftColX = this.margin;
    const leftColWidth = (this.pageWidth - 2 * this.margin) * 0.46; // Reduced to 46% for better fit
    const rightColX = this.margin + leftColWidth + 8; // More gap
    const rightColWidth = (this.pageWidth - 2 * this.margin) * 0.54 - 8; // Right 54% for specs + pricing
    
    const startY = this.currentY;
    const leftStartY = this.currentY;
    
    // Check if we have enough space for the diagram (increased safety margin)
    const estimatedDiagramHeight = 90; // Increased estimated height needed
    if (this.currentY + estimatedDiagramHeight > this.pageHeight - this.margin - 25) {
      // Not enough space, start on new page
      this.pdf.addPage();
      this.currentY = this.margin;
      this.addHeader(this.quotationData);
      this.addQuoteInfo(this.quotationData);
      
      // Redraw section title
      this.pdf.setFillColor(...this.colors.primary);
      this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 10, 'F');
      this.pdf.setFillColor(...this.colors.gold);
      this.pdf.rect(this.margin, this.currentY, 4, 10, 'F');
      this.pdf.setTextColor(...this.colors.white);
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`Window Specification ${index + 1}: ${windowName}`, this.margin + 8, this.currentY + 7);
      this.currentY += 15;
    }
    
    const actualStartY = this.currentY;
    
    // LEFT COLUMN: Diagram ONLY (with proper space management)
    await this.addWindowDiagramEnhanced(spec, leftColX, leftColWidth);
    
    // Store the Y position after diagram
    const afterDiagramY = this.currentY;
    
    // Reset Y to start for right column
    this.currentY = actualStartY;
    
    // RIGHT COLUMN TOP: Basic Info Table
    this.addBasicInfoTableEnhanced(spec, rightColX, rightColWidth);
    
    // RIGHT COLUMN MIDDLE: Specifications in two-column grid
    this.addSpecificationsTableEnhanced(spec, rightColX, rightColWidth);
    
    // RIGHT COLUMN BOTTOM: Computed Values & Pricing
    this.addComputedValuesEnhanced(spec, rightColX, rightColWidth, this.currentY);
    
    // Set currentY to the maximum of both columns with extra spacing
    this.currentY = Math.max(afterDiagramY, this.currentY) + 8;
  }

  /**
   * Add basic information table
   */
  addBasicInfoTable(spec) {
    const startY = this.currentY;
    const tableWidth = this.pageWidth - 2 * this.margin;
    const colWidth = tableWidth / 4;
    
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...this.colors.text);
    
    // Safely extract values and convert to strings
    const id = String(spec.id || 'N/A');
    const type = this.formatWindowType(spec.type);
    const name = String(spec.name || 'N/A');
    const location = String(spec.location || 'N/A');
    const width = spec.dimensions && spec.dimensions.width ? `${spec.dimensions.width} mm` : '0 mm';
    const height = spec.dimensions && spec.dimensions.height ? `${spec.dimensions.height} mm` : '0 mm';
    
    const rows = [
      ['ID:', id, 'Type:', type],
      ['Name:', name, 'Location:', location],
      ['Width:', width, 'Height:', height]
    ];
    
    rows.forEach((row, rowIndex) => {
      const y = startY + (rowIndex * 7);
      
      // Draw cell backgrounds
      this.pdf.setFillColor(...this.colors.lightGray);
      this.pdf.rect(this.margin, y, colWidth, 7, 'F');
      this.pdf.rect(this.margin + colWidth * 2, y, colWidth, 7, 'F');
      
      // Draw borders
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.rect(this.margin, y, tableWidth, 7, 'S');
      
      // Add text - ensure all values are strings
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(String(row[0]), this.margin + 2, y + 5);
      this.pdf.text(String(row[2]), this.margin + colWidth * 2 + 2, y + 5);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(String(row[1]), this.margin + colWidth + 2, y + 5);
      this.pdf.text(String(row[3]), this.margin + colWidth * 3 + 2, y + 5);
    });
    
    this.currentY = startY + (rows.length * 7) + 5;
  }

  /**
   * Add basic information table (clean professional design matching screenshot)
   */
  addBasicInfoTableEnhanced(spec, startX, columnWidth) {
    // Extract dimensions safely - handle both old and new data structures
    const width = spec.dimensions?.width || spec.width || 0;
    const height = spec.dimensions?.height || spec.height || 0;
    const windowType = spec.type || spec.selectedWindowType || 'N/A';
    const openingType = spec.specifications?.openingType || spec.openingType || 'N/A';
    
    const tableData = [
      ['Window Type', String(this.formatWindowType(windowType) || 'N/A')],
      ['Opening Type', String(openingType || 'N/A')],
      ['Dimensions', `${this.formatNumber(width)} × ${this.formatNumber(height)} mm`]
    ];
    
    // Clean simple borders
    this.pdf.setDrawColor(180, 180, 180);
    this.pdf.setLineWidth(0.3);
    
    const rowHeight = 6; // More compact
    const labelWidth = columnWidth * 0.45;
    const valueWidth = columnWidth * 0.55;
    
    tableData.forEach((row, index) => {
      const y = this.currentY + index * rowHeight;
      
      // Label cell - clean white with border
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.rect(startX, y, labelWidth, rowHeight, 'FD');
      this.pdf.setFontSize(7); // Smaller font
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(String(row[0] || '') + ' :', startX + 2, y + 4.5);
      
      // Value cell - clean white with border
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.rect(startX + labelWidth, y, valueWidth, rowHeight, 'FD');
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFontSize(7); // Smaller font
      this.pdf.text(String(row[1] || 'N/A'), startX + labelWidth + 2, y + 4.5);
    });
    
    this.currentY += tableData.length * rowHeight + 3; // Reduced spacing
  }

  /**
   * Add window diagram visualization
   */
  async addWindowDiagram(spec) {
    // Create a temporary div to render the window shape
    const diagramDiv = document.createElement('div');
    diagramDiv.style.position = 'absolute';
    diagramDiv.style.left = '-9999px';
    diagramDiv.style.width = '300px';
    diagramDiv.style.height = '250px';
    diagramDiv.style.background = 'white';
    diagramDiv.style.padding = '20px';
    
    // Generate SVG for the window
    const svg = this.generateWindowSVG(spec);
    diagramDiv.innerHTML = svg;
    
    document.body.appendChild(diagramDiv);
    
    try {
      // Capture the diagram as canvas
      const canvas = await html2canvas(diagramDiv, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      // Add to PDF
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Center the image
      const imgX = (this.pageWidth - imgWidth) / 2;
      this.pdf.addImage(imgData, 'PNG', imgX, this.currentY, imgWidth, imgHeight);
      
      this.currentY += imgHeight + 5;
    } catch (error) {
      console.error('Error adding diagram:', error);
      // Add placeholder text if diagram fails
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.text('[Window Diagram]', this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 10;
    } finally {
      document.body.removeChild(diagramDiv);
    }
  }

  /**
   * Generate SVG for window shape
   */
  generateWindowSVG(spec) {
    const { width, height } = spec.dimensions || { width: 1000, height: 1000 };
    const scale = Math.min(250 / Math.max(width, height), 0.25);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    
    return `
      <svg width="300" height="250" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="10" width="${scaledWidth}" height="${scaledHeight}" 
              fill="rgba(173, 216, 230, 0.3)" stroke="#333" stroke-width="3"/>
        <text x="150" y="230" text-anchor="middle" font-size="12" fill="#666">
          ${width} × ${height} mm
        </text>
      </svg>
    `;
  }

  /**
   * Add specifications table
   */
  addSpecificationsTable(spec) {
    const startY = this.currentY;
    const tableWidth = this.pageWidth - 2 * this.margin;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(...this.colors.secondary);
    this.pdf.text('Specifications:', this.margin, this.currentY);
    this.currentY += 7;
    
    const specs = spec.specifications || {};
    
    // Safely extract values
    const glassType = this.formatGlassType(specs.glass);
    const frameMaterial = this.formatFrameMaterial(specs.frame?.material);
    const frameColor = String(specs.frame?.color || 'N/A');
    const lockPosition = String(specs.lockPosition || 'N/A');
    const panels = String(specs.panels || 'N/A');
    const tracks = String(specs.tracks || 'N/A');
    const grille = specs.grille?.enabled ? 
      `${String(specs.grille.style || 'standard')} - ${String(specs.grille.pattern || 'grid')}` : 
      'No grille';
    
    const specRows = [
      ['Glass Type:', glassType],
      ['Frame Material:', frameMaterial],
      ['Frame Color:', frameColor],
      ['Lock Position:', lockPosition],
      ['Panels:', panels],
      ['Tracks:', tracks],
      ['Grille:', grille]
    ];
    
    this.pdf.setFontSize(9);
    
    specRows.forEach((row, index) => {
      const y = this.currentY + (index * 6);
      
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(...this.colors.text);
      this.pdf.text(String(row[0]), this.margin + 5, y);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(String(row[1]), this.margin + 50, y);
    });
    
    this.currentY += (specRows.length * 6) + 5;
  }

  /**
   * Add computed values in a clean table format
   */
  addComputedValues(spec) {
    const startY = this.currentY;
    const tableWidth = this.pageWidth - 2 * this.margin;
    
    // Title
    this.pdf.setFillColor(...this.colors.secondary);
    this.pdf.rect(this.margin, this.currentY, tableWidth, 7, 'F');
    this.pdf.setTextColor(...this.colors.white);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Computed Values & Pricing', this.margin + 3, this.currentY + 5);
    
    this.currentY += 10;
    
    const computed = spec.computedValues || {};
    const pricing = spec.pricing || {};
    
    const valueRows = [
      ['Square Feet per Window:', `${computed.sqFtPerWindow?.toFixed(3) || '0.000'} Sq.Ft.`],
      ['Base Price:', `Rs. ${pricing.basePrice?.toFixed(2) || '0.00'}`],
      ['Price per Sq.Ft:', `Rs. ${pricing.sqFtPrice?.toFixed(2) || '0.00'}`],
      ['Quantity:', `${pricing.quantity || 1} Pcs`],
      ['Total Price:', `Rs. ${computed.totalPrice?.toFixed(2) || '0.00'}`],
      ['Approximate Weight:', `${computed.weight?.toFixed(2) || '0.00'} KG`]
    ];
    
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(...this.colors.text);
    
    valueRows.forEach((row, index) => {
      const y = this.currentY + (index * 7);
      
      // Alternating row colors
      if (index % 2 === 0) {
        this.pdf.setFillColor(...this.colors.lightGray);
        this.pdf.rect(this.margin, y, tableWidth, 7, 'F');
      }
      
      // Draw border
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.rect(this.margin, y, tableWidth, 7, 'S');
      
      // Add text
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(row[0], this.margin + 3, y + 5);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(row[1], this.margin + tableWidth - 3, y + 5, { align: 'right' });
    });
    
    this.currentY += (valueRows.length * 7) + 5;
  }

  /**
   * Add window diagram visualization (enhanced) - Captures real diagram with all configurations
   */
  async addWindowDiagramEnhanced(spec, startX, columnWidth) {
    // Calculate available space to ensure diagram fits without cutting
    const availableHeight = this.pageHeight - this.currentY - this.margin - 20; // Reduced buffer for compact layout
    
    // First, try to use the pre-captured diagram snapshot if available
    if (spec.diagramSnapshot) {
      try {
        const imgWidth = columnWidth - 4; // Minimal padding
        // Compact dynamic height for space efficiency
        let imgHeight = Math.min(
          50, // Reduced from 70 for more compact layout
          imgWidth * 0.75, // Tighter aspect ratio
          availableHeight * 0.60 // More conservative usage
        );
        
        // Add the diagram image directly (as it appears in app)
        this.pdf.addImage(spec.diagramSnapshot, 'PNG', startX + 2, this.currentY, imgWidth, imgHeight);
        
        this.currentY += imgHeight + 5; // Reduced spacing for compact layout
        return;
      } catch (error) {
        console.warn('Error using pre-captured diagram snapshot, falling back to SVG generation:', error);
      }
    }
    
    // Fallback: Try to find and capture the actual WindowDiagram element on the page
    const diagramElement = document.querySelector('.window-diagram-container');
    
    if (diagramElement) {
      try {
        // Clone the diagram to avoid modifying the original
        const clonedDiagram = diagramElement.cloneNode(true);
        clonedDiagram.style.position = 'absolute';
        clonedDiagram.style.left = '-9999px';
        clonedDiagram.style.background = 'white';
        clonedDiagram.style.padding = '15px';
        clonedDiagram.style.border = '1px solid #ccc';
        clonedDiagram.style.borderRadius = '5px';
        
        document.body.appendChild(clonedDiagram);
        
        const canvas = await html2canvas(clonedDiagram, {
          backgroundColor: '#ffffff',
          scale: 4, // Ultra high quality capture
          logging: false,
          useCORS: true,
          allowTaint: false,
          removeContainer: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = columnWidth - 4; // Minimal padding
        const availableHeight = this.pageHeight - this.currentY - this.margin - 15;
        // Compact dynamic height for space efficiency
        let imgHeight = Math.min(
          (canvas.height * imgWidth) / canvas.width,
          50, // Reduced from 70 for more compact layout
          availableHeight * 0.60 // More conservative usage
        );
        
        // Add the diagram image directly (as it appears in app)
        this.pdf.addImage(imgData, 'PNG', startX + 2, this.currentY, imgWidth, imgHeight);
        this.currentY += imgHeight + 5; // Reduced spacing
        
        document.body.removeChild(clonedDiagram);
        return;
      } catch (error) {
        console.error('Error capturing live diagram:', error);
      }
    }
    
    // Second fallback: Generate SVG with complete configuration
    const diagramDiv = document.createElement('div');
    diagramDiv.style.position = 'absolute';
    diagramDiv.style.left = '-9999px';
    diagramDiv.style.width = `${columnWidth * 3}px`;
    diagramDiv.style.height = '220px'; // More height for SVG rendering
    diagramDiv.style.background = 'white';
    diagramDiv.style.padding = '15px';
    diagramDiv.style.border = '1px solid #ddd';
    diagramDiv.style.borderRadius = '5px';
    
    const svg = this.generateCompleteWindowSVG(spec);
    diagramDiv.innerHTML = svg;
    
    document.body.appendChild(diagramDiv);
    
    try {
      const canvas = await html2canvas(diagramDiv, {
        backgroundColor: '#ffffff',
        scale: 4, // Ultra high quality
        logging: false,
        allowTaint: false,
        removeContainer: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = columnWidth - 4; // Minimal padding
      const availableHeight = this.pageHeight - this.currentY - this.margin - 15;
      // Compact dynamic height for space efficiency
      let imgHeight = Math.min(
        (canvas.height * imgWidth) / canvas.width,
        50, // Reduced from 70 for more compact layout
        availableHeight * 0.60 // More conservative usage
      );
      
      // Add the diagram image directly (as it appears in app)
      this.pdf.addImage(imgData, 'PNG', startX + 2, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 5; // Reduced spacing
    } catch (error) {
      console.error('Error adding diagram:', error);
      this.pdf.setFontSize(9);
      this.pdf.setTextColor(150, 150, 150);
      this.pdf.text('[Window Diagram]', startX + columnWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 10;
    } finally {
      document.body.removeChild(diagramDiv);
    }
  }

  /**
   * Generate complete SVG for window shape with full configuration details
   */
  generateCompleteWindowSVG(spec) {
    const width = spec.dimensions?.width || spec.width || 1000;
    const height = spec.dimensions?.height || spec.height || 1000;
    const windowType = spec.type || spec.selectedWindowType || 'sliding';
    
    // Get specifications
    const specifications = spec.specifications || {};
    const glassType = specifications.glass || spec.glassType || 'single';
    const frameMaterial = specifications.frame?.material || spec.frameMaterial || 'aluminum';
    const frameColor = specifications.frame?.color || spec.frameColor || 'white';
    const grillType = specifications.grille?.style || spec.grilles || 'none';
    const panels = specifications.panels || spec.panels || 2;
    
    // Enhanced colors based on material and type
    const getFrameColor = () => {
      const materialColors = {
        aluminum: { white: '#F5F5F5', black: '#2C2C2C', brown: '#8B4513', grey: '#808080' },
        upvc: { white: '#FFFFFF', black: '#1C1C1C', brown: '#8B4513', grey: '#A9A9A9' },
        wooden: { white: '#FFF8DC', black: '#3C3C3C', brown: '#8B4513', grey: '#DCDCDC' }
      };
      return materialColors[frameMaterial]?.[frameColor] || '#F5F5F5';
    };
    
    const getGlassColor = () => {
      const glassColors = {
        single: '#E6F3FF',
        double: '#E8F4FD',
        triple: '#EAF5FE',
        'low-e': '#E6F9FF'
      };
      return glassColors[glassType] || '#E6F3FF';
    };
    
    const scale = Math.min(180 / Math.max(width, height), 0.18);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const frameThickness = 5;
    const actualFrameColor = getFrameColor();
    const actualGlassColor = getGlassColor();
    
    // Render grills function
    const renderGrills = (x, y, w, h) => {
      if (!grillType || grillType === 'none') return '';
      
      const grillColor = '#FFFFFF';
      const grillWidth = 1.2;
      
      switch (grillType) {
        case 'colonial':
          const cols = w > 80 ? 4 : 3;
          const rows = h > 120 ? 3 : 2;
          const cellWidth = w / cols;
          const cellHeight = h / rows;
          let grillsSVG = '';
          
          // Vertical lines
          for (let i = 1; i < cols; i++) {
            grillsSVG += `<line x1="${x + i * cellWidth}" y1="${y}" x2="${x + i * cellWidth}" y2="${y + h}" stroke="${grillColor}" stroke-width="${grillWidth}"/>`;
          }
          
          // Horizontal lines
          for (let i = 1; i < rows; i++) {
            grillsSVG += `<line x1="${x}" y1="${y + i * cellHeight}" x2="${x + w}" y2="${y + i * cellHeight}" stroke="${grillColor}" stroke-width="${grillWidth}"/>`;
          }
          
          return grillsSVG;
          
        case 'prairie':
          return `
            <line x1="${x + w/2}" y1="${y}" x2="${x + w/2}" y2="${y + h}" stroke="${grillColor}" stroke-width="${grillWidth}"/>
            <line x1="${x}" y1="${y + h/2}" x2="${x + w}" y2="${y + h/2}" stroke="${grillColor}" stroke-width="${grillWidth}"/>
          `;
          
        case 'georgian':
          return `
            <line x1="${x + w/3}" y1="${y}" x2="${x + w/3}" y2="${y + h}" stroke="${grillColor}" stroke-width="${grillWidth}"/>
            <line x1="${x + 2*w/3}" y1="${y}" x2="${x + 2*w/3}" y2="${y + h}" stroke="${grillColor}" stroke-width="${grillWidth}"/>
            <line x1="${x}" y1="${y + h/2}" x2="${x + w}" y2="${y + h/2}" stroke="${grillColor}" stroke-width="${grillWidth}"/>
          `;
          
        default:
          return '';
      }
    };
    
    // Generate SVG based on window type
    let windowSVG = '';
    
    if (windowType === 'sliding' || windowType === 'Sliding Windows') {
      const panelWidth = (scaledWidth - frameThickness * 2) / panels;
      
      windowSVG = `
        <!-- Outer frame -->
        <rect x="20" y="10" width="${scaledWidth}" height="${scaledHeight}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2" rx="2"/>
        
        <!-- Panels -->
        ${Array.from({length: panels}, (_, i) => {
          const panelX = 20 + frameThickness + (i * panelWidth);
          const panelY = 10 + frameThickness;
          const panelH = scaledHeight - 2 * frameThickness;
          
          return `
            <!-- Panel ${i + 1} -->
            <rect x="${panelX}" y="${panelY}" width="${panelWidth - 1}" height="${panelH}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
            ${renderGrills(panelX + 2, panelY + 2, panelWidth - 5, panelH - 4)}
            
            <!-- Panel separator -->
            ${i < panels - 1 ? `<rect x="${panelX + panelWidth - 1}" y="${panelY}" width="2" height="${panelH}" fill="${actualFrameColor}"/>` : ''}
            
            <!-- Handle -->
            <circle cx="${panelX + panelWidth - 10}" cy="${panelY + panelH/2}" r="3" fill="#666" stroke="#333" stroke-width="0.5"/>
            
            <!-- Movement indicator -->
            <text x="${panelX + panelWidth/2}" y="${panelY + panelH/2}" text-anchor="middle" font-size="10" fill="#e74c3c" font-weight="bold">S</text>
          `;
        }).join('')}
        
        <!-- Bottom track -->
        <rect x="22" y="${10 + scaledHeight - frameThickness - 2}" width="${scaledWidth - 4}" height="2" fill="#999"/>
      `;
      
    } else if (windowType === 'casement' || windowType === 'Casement Windows') {
      windowSVG = `
        <!-- Outer frame -->
        <rect x="20" y="10" width="${scaledWidth}" height="${scaledHeight}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2" rx="2"/>
        
        <!-- Glass -->
        <rect x="${20 + frameThickness}" y="${10 + frameThickness}" width="${scaledWidth - 2*frameThickness}" height="${scaledHeight - 2*frameThickness}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
        
        ${renderGrills(20 + frameThickness + 2, 10 + frameThickness + 2, scaledWidth - 2*frameThickness - 4, scaledHeight - 2*frameThickness - 4)}
        
        <!-- Hinges (left side) -->
        <rect x="22" y="25" width="4" height="8" fill="#666" rx="1"/>
        <rect x="22" y="${10 + scaledHeight/2 - 4}" width="4" height="8" fill="#666" rx="1"/>
        <rect x="22" y="${10 + scaledHeight - 33}" width="4" height="8" fill="#666" rx="1"/>
        
        <!-- Handle (right side) -->
        <circle cx="${20 + scaledWidth - 15}" cy="${10 + scaledHeight/2}" r="4" fill="#666" stroke="#333" stroke-width="1"/>
        <line x1="${20 + scaledWidth - 15}" y1="${10 + scaledHeight/2}" x2="${20 + scaledWidth - 12}" y2="${10 + scaledHeight/2 - 4}" stroke="#333" stroke-width="2"/>
      `;
      
    } else if (windowType === 'bay' || windowType === 'Bay Windows') {
      const angle = spec.bayConfig?.angle || 30;
      const angleRad = (angle * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      
      const centerX = scaledWidth / 2 + 20;
      const centerY = 15;
      const centerWidth = scaledWidth * 0.5;
      const sideWidth = scaledWidth * 0.25;
      const panelHeight = scaledHeight - 20;
      const depth = sideWidth * sin * 0.8;
      
      windowSVG = `
        <!-- Left angled panel -->
        <polygon points="${centerX - centerWidth/2 - depth},${centerY + depth} ${centerX - centerWidth/2},${centerY} ${centerX - centerWidth/2},${centerY + panelHeight} ${centerX - centerWidth/2 - depth},${centerY + panelHeight + depth}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2"/>
        <polygon points="${centerX - centerWidth/2 - depth + frameThickness},${centerY + depth + frameThickness} ${centerX - centerWidth/2 - frameThickness},${centerY + frameThickness} ${centerX - centerWidth/2 - frameThickness},${centerY + panelHeight - frameThickness} ${centerX - centerWidth/2 - depth + frameThickness},${centerY + panelHeight + depth - frameThickness}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
        
        <!-- Center flat panel -->
        <rect x="${centerX - centerWidth/2}" y="${centerY}" width="${centerWidth}" height="${panelHeight}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2"/>
        <rect x="${centerX - centerWidth/2 + frameThickness}" y="${centerY + frameThickness}" width="${centerWidth - 2*frameThickness}" height="${panelHeight - 2*frameThickness}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
        
        <!-- Right angled panel -->
        <polygon points="${centerX + centerWidth/2 - frameThickness},${centerY} ${centerX + centerWidth/2 + depth},${centerY + depth} ${centerX + centerWidth/2 + depth},${centerY + panelHeight + depth} ${centerX + centerWidth/2 - frameThickness},${centerY + panelHeight}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2"/>
        <polygon points="${centerX + centerWidth/2},${centerY + frameThickness} ${centerX + centerWidth/2 + depth - frameThickness},${centerY + depth + frameThickness} ${centerX + centerWidth/2 + depth - frameThickness},${centerY + panelHeight + depth - frameThickness} ${centerX + centerWidth/2},${centerY + panelHeight - frameThickness}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
        
        <!-- Panel labels -->
        <text x="${centerX - centerWidth/2 - depth/2}" y="8" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">1/4</text>
        <text x="${centerX}" y="8" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">1/2</text>
        <text x="${centerX + centerWidth/2 + depth/2}" y="8" text-anchor="middle" font-size="9" fill="#333" font-weight="bold">1/4</text>
        
        <!-- Angle indicator -->
        <text x="${centerX - centerWidth/2 - depth - 15}" y="${centerY + panelHeight/2}" font-size="8" fill="#666">${angle}°</text>
      `;
      
    } else {
      // Default simple window
      windowSVG = `
        <rect x="20" y="10" width="${scaledWidth}" height="${scaledHeight}" fill="${actualFrameColor}" stroke="${actualFrameColor}" stroke-width="2" rx="2"/>
        <rect x="${20 + frameThickness}" y="${10 + frameThickness}" width="${scaledWidth - 2*frameThickness}" height="${scaledHeight - 2*frameThickness}" fill="${actualGlassColor}" stroke="#ccc" stroke-width="1"/>
        ${renderGrills(20 + frameThickness + 2, 10 + frameThickness + 2, scaledWidth - 2*frameThickness - 4, scaledHeight - 2*frameThickness - 4)}
      `;
    }
    
    return `
      <svg width="${scaledWidth + 40}" height="${scaledHeight + 50}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="windowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${actualGlassColor};stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:${actualGlassColor};stop-opacity:1" />
          </linearGradient>
          <filter id="shadowEffect" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.2)"/>
          </filter>
        </defs>
        
        <g filter="url(#shadowEffect)">
          ${windowSVG}
        </g>
        
        <!-- Dimensions label -->
        <rect x="${(scaledWidth + 40) / 2 - 50}" y="${scaledHeight + 30}" width="100" height="16" fill="rgba(26,82,118,0.1)" stroke="#1a5276" stroke-width="1" rx="3"/>
        <text x="${(scaledWidth + 40) / 2}" y="${scaledHeight + 41}" text-anchor="middle" font-size="10" fill="#1a5276" font-weight="bold">
          ${width} × ${height} mm
        </text>
        
        <!-- Material & Glass Type indicators -->
        <text x="5" y="${scaledHeight + 20}" font-size="7" fill="#555">${this.formatFrameMaterial(frameMaterial)}</text>
        <text x="5" y="${scaledHeight + 30}" font-size="7" fill="#555">${this.formatGlassType(glassType)}</text>
      </svg>
    `;
  }

  /**
   * Add specifications table (enhanced with dynamic sections and improved formatting)
   */
  addSpecificationsTableEnhanced(spec, startX, columnWidth) {
    // Extract ALL specifications from the data structure
    const specifications = spec.specifications || {};
    const glassType = specifications.glass || spec.glassType || 'single';
    const glassTint = specifications.glassTint || spec.glassTint || 'clear';
    const glassThickness = specifications.glassThickness || (glassType === 'double' ? 10 : 5);
    const frameMaterial = specifications.frame?.material || spec.frameMaterial || 'aluminum';
    const frameColor = specifications.frame?.color || spec.frameColor || 'white';
    const lockPosition = specifications.lockPosition || spec.lockPosition || 'right';
    const openingType = specifications.openingType || spec.openingType || 'fixed';
    const hardware = specifications.hardware || spec.hardware || 'standard';
    const panels = specifications.panels || spec.panels || 2;
    const tracks = specifications.tracks || spec.tracks || 1;
    const screenIncluded = specifications.screenIncluded || spec.screenIncluded || false;
    const motorized = specifications.motorized || spec.motorized || false;
    const security = specifications.security || spec.security || 'standard';
    
    // Grille information
    const grilleEnabled = specifications.grille?.enabled || false;
    const grilleStyle = specifications.grille?.style || specifications.grilles || spec.grilles || 'none';
    const grillColor = specifications.grillColor || spec.grillColor || 'white';
    const grillePattern = specifications.grille?.pattern || 'grid';
    
    // Organize specs into logical sections for better readability
    const specSections = [
      {
        title: 'GLASS SPECIFICATIONS',
        specs: [
          ['Type', this.formatGlassType(glassType)],
          ['Tint', String(glassTint).charAt(0).toUpperCase() + String(glassTint).slice(1)],
          ['Thickness', `${glassThickness}mm`]
        ]
      },
      {
        title: 'FRAME & HARDWARE',
        specs: [
          ['Material', this.formatFrameMaterial(frameMaterial)],
          ['Color', String(frameColor).charAt(0).toUpperCase() + String(frameColor).slice(1)],
          ['Hardware', String(hardware).charAt(0).toUpperCase() + String(hardware).slice(1)],
          ['Lock Position', String(lockPosition).charAt(0).toUpperCase() + String(lockPosition).slice(1)]
        ]
      },
      {
        title: 'CONFIGURATION',
        specs: [
          ['Opening Type', String(openingType).charAt(0).toUpperCase() + String(openingType).slice(1)],
          ['Panels', String(panels)],
          ['Tracks', String(tracks)]
        ]
      }
    ];

    // Add optional sections only if they have meaningful data
    if (grilleEnabled && grilleStyle !== 'none') {
      specSections.push({
        title: 'GRILLE DETAILS',
        specs: [
          ['Style', this.formatGrilleStyle(grilleStyle)],
          ['Color', String(grillColor).charAt(0).toUpperCase() + String(grillColor).slice(1)],
          ['Pattern', String(grillePattern).charAt(0).toUpperCase() + String(grillePattern).slice(1)]
        ]
      });
    }

    if (screenIncluded || motorized || security !== 'standard') {
      const additionalSpecs = [];
      if (screenIncluded) additionalSpecs.push(['Screen', 'Included']);
      if (motorized) additionalSpecs.push(['Motorized', 'Yes']);
      if (security !== 'standard') additionalSpecs.push(['Security', String(security).charAt(0).toUpperCase() + String(security).slice(1)]);
      
      if (additionalSpecs.length > 0) {
        specSections.push({
          title: 'ADDITIONAL FEATURES',
          specs: additionalSpecs
        });
      }
    }
    
    const rowHeight = 6; // Slightly larger for better readability
    const sectionGap = 3;
    const headerHeight = 8;
    
    // Calculate total height needed for all sections
    const totalHeight = specSections.reduce((height, section) => {
      return height + headerHeight + (section.specs.length * rowHeight) + sectionGap;
    }, 0);
    
    // Check if we need a page break
    this.checkPageBreak(totalHeight + 20);
    
    // Render each section with professional black and white styling
    specSections.forEach((section, sectionIndex) => {
      // Section header with clean black border
      this.pdf.setFillColor(245, 245, 245); // Light gray background
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(0.5);
      this.pdf.rect(startX, this.currentY, columnWidth, headerHeight, 'FD');
      
      this.pdf.setTextColor(0, 0, 0); // Black text
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(section.title, startX + 3, this.currentY + 5.5);
      this.currentY += headerHeight;
      
      // Section content with visible borders
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(0.3);
      
      const labelWidth = columnWidth * 0.45;
      const valueWidth = columnWidth * 0.55;
      
      section.specs.forEach((spec, index) => {
        const y = this.currentY + index * rowHeight;
        
        // White background for all rows
        this.pdf.setFillColor(255, 255, 255);
        
        // Label cell with border
        this.pdf.rect(startX, y, labelWidth, rowHeight, 'FD');
        this.pdf.setFontSize(7);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setTextColor(60, 60, 60);
        this.pdf.text(String(spec[0] || ''), startX + 2, y + 4);
        
        // Value cell with border and emphasis
        this.pdf.rect(startX + labelWidth, y, valueWidth, rowHeight, 'FD');
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setTextColor(0, 0, 0);
        this.pdf.setFontSize(7);
        
        // Smart text truncation with proper wrapping
        const maxLength = 20;
        let displayValue = String(spec[1] || 'N/A');
        if (displayValue.length > maxLength) {
          displayValue = displayValue.substring(0, maxLength - 2) + '..';
        }
        this.pdf.text(displayValue, startX + labelWidth + 2, y + 4);
      });
      
      this.currentY += section.specs.length * rowHeight + sectionGap;
    });
    
    // Add final spacing
    this.currentY += 5;
  }

  /**
   * Format grille style for display
   */
  formatGrilleStyle(style) {
    if (!style || style === 'none') return 'None';
    const styles = {
      'colonial': 'Colonial',
      'prairie': 'Prairie',
      'diamond': 'Diamond',
      'georgian': 'Georgian',
      'custom': 'Custom'
    };
    return styles[String(style).toLowerCase()] || String(style).charAt(0).toUpperCase() + String(style).slice(1);
  }

  /**
   * Add computed values (clean black and white design with proper text fitting)
   */
  addComputedValuesEnhanced(spec, startX, columnWidth, startY) {
    let localY = startY;
    
    // Extract data safely from both old and new structures
    const width = spec.dimensions?.width || spec.width || 0;
    const height = spec.dimensions?.height || spec.height || 0;
    const area = (width * height) / 92903; // mm² to sq.ft.
    const sqFtPrice = spec.pricing?.sqFtPrice || spec.sqFtPrice || 450;
    const quantity = spec.pricing?.quantity || spec.quantity || 1;
    const unitPrice = area * sqFtPrice;
    const totalPrice = unitPrice * quantity;
    const weight = spec.computedValues?.weight || spec.weight || (area * 15); // Estimated weight
    
    // Clean card design - PRICING BREAKDOWN (White with black border)
    const cardHeight = 22;
    const cardSpacing = 4;
    
    // PRICING BREAKDOWN Card
    this.pdf.setFillColor(255, 255, 255); // White background
    this.pdf.setDrawColor(0, 0, 0); // Black border
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(startX, localY, columnWidth, cardHeight, 2, 2, 'FD');
    
    // Card header with black text only (no blue background)
    this.pdf.setTextColor(0, 0, 0); // Black text
    this.pdf.setFontSize(7);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('PRICING BREAKDOWN', startX + 2, localY + 4);
    
    // Card content with proper sizing
    const pricingItems = [
      ['Rate per Sq.Ft.', this.formatCurrency(sqFtPrice)],
      ['Unit Price', this.formatCurrency(unitPrice)],
      ['Quantity', `${quantity} Pc`]
    ];
    
    let itemY = localY + 8;
    pricingItems.forEach((item, index) => {
      // Label (left side)
      this.pdf.setTextColor(60, 60, 60);
      this.pdf.setFontSize(6);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(item[0], startX + 2, itemY + 2);
      
      // Value (right side, properly fitted)
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(6);
      
      // Truncate text if too long to fit
      const maxWidth = columnWidth - 6;
      const textWidth = this.pdf.getTextWidth(item[1]);
      let displayText = item[1];
      
      if (textWidth > maxWidth * 0.45) { // If text takes more than 45% of width
        // Truncate and add ellipsis
        displayText = item[1].substring(0, 8) + '...';
      }
      
      this.pdf.text(displayText, startX + columnWidth - 2, itemY + 2, { align: 'right' });
      
      itemY += 4;
    });
    
    localY += cardHeight + cardSpacing;
    
    // TOTAL CALCULATION Card
    this.pdf.setFillColor(255, 255, 255); // White background
    this.pdf.setDrawColor(0, 0, 0); // Black border
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(startX, localY, columnWidth, cardHeight, 2, 2, 'FD');
    
    // Card header with black text only (no blue background)
    this.pdf.setTextColor(0, 0, 0); // Black text
    this.pdf.setFontSize(7);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('TOTAL CALCULATION', startX + 2, localY + 4);
    
    // Card content
    const totalItems = [
      ['Total Value', this.formatCurrency(totalPrice)],
      ['Est. Weight', `${this.formatNumber(weight)} KG`]
    ];
    
    itemY = localY + 8;
    totalItems.forEach((item, index) => {
      // Label
      this.pdf.setTextColor(60, 60, 60);
      this.pdf.setFontSize(6);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(item[0], startX + 2, itemY + 2);
      
      // Value (properly fitted)
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(6);
      
      // Truncate text if too long to fit
      const maxWidth = columnWidth - 6;
      const textWidth = this.pdf.getTextWidth(item[1]);
      let displayText = item[1];
      
      if (textWidth > maxWidth * 0.45) {
        displayText = item[1].substring(0, 8) + '...';
      }
      
      this.pdf.text(displayText, startX + columnWidth - 2, itemY + 2, { align: 'right' });
      
      itemY += 4;
    });
    
    localY += cardHeight + cardSpacing;
    
    // Update the class currentY to match localY for proper flow
    this.currentY = localY + 2;
  }

  /**
   * Add quotation totals with clean black and white design
   */
  addQuoteTotals(quotationData) {
    const startY = this.currentY;
    const tableWidth = this.pageWidth - 2 * this.margin;
    
    // Check if we have enough space for the entire quotation summary section
    const estimatedHeight = 80; // Approximate height for title + cards + totals
    this.checkPageBreak(estimatedHeight);
    
    // Title section with black border only
    this.pdf.setFillColor(255, 255, 255); // White background
    this.pdf.setDrawColor(0, 0, 0); // Black border
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, this.currentY, tableWidth, 12, 3, 3, 'FD');
    
    this.pdf.setTextColor(0, 0, 0); // Black text
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('QUOTATION SUMMARY', this.margin + 8, this.currentY + 8);
    
    this.currentY += 18;
    
    // Calculate totals safely
    const totalArea = quotationData.windowSpecs.reduce((sum, spec) => {
      const width = spec.dimensions?.width || spec.width || 0;
      const height = spec.dimensions?.height || spec.height || 0;
      const area = (width * height) / 92903; // mm² to sq.ft.
      return sum + area;
    }, 0);
    
    const totalComponents = quotationData.windowSpecs.reduce((sum, spec) => {
      const quantity = spec.pricing?.quantity || spec.quantity || 1;
      return sum + quantity;
    }, 0);
    
    const basicValue = quotationData.windowSpecs.reduce((sum, spec) => {
      const width = spec.dimensions?.width || spec.width || 0;
      const height = spec.dimensions?.height || spec.height || 0;
      const area = (width * height) / 92903;
      const sqFtPrice = spec.pricing?.sqFtPrice || spec.sqFtPrice || 450;
      const quantity = spec.pricing?.quantity || spec.quantity || 1;
      return sum + (area * sqFtPrice * quantity);
    }, 0);
    
    const transportCost = quotationData.transportCost || 2000;
    const subtotal = basicValue + transportCost;
    const gstRate = quotationData.gstRate || 0.18;
    const gst = subtotal * gstRate;
    const grandTotal = subtotal + gst;
    
    // Clean black and white card layout
    const cardWidth = (tableWidth - 16) / 3; // 3 cards with spacing
    const cardHeight = 32;
    const cardSpacing = 8;
    
    // PROJECT SCOPE Card (White with black border only)
    this.pdf.setFillColor(255, 255, 255); // White background
    this.pdf.setDrawColor(0, 0, 0); // Black border
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, this.currentY, cardWidth, cardHeight, 3, 3, 'FD');
    
    // Black header text only (no blue background)
    this.pdf.setTextColor(0, 0, 0); // Black text
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('PROJECT SCOPE', this.margin + 3, this.currentY + 5);
    
    // Content with proper sizing
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.setFontSize(6);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Total Components', this.margin + 3, this.currentY + 12);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(`${totalComponents} Pieces`, this.margin + cardWidth - 3, this.currentY + 12, { align: 'right' });
    
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Total Coverage', this.margin + 3, this.currentY + 19);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'bold');
    const areaText = `${this.formatNumber(totalArea)} Sq.Ft.`;
    this.pdf.text(areaText, this.margin + cardWidth - 3, this.currentY + 19, { align: 'right' });
    
    // COST BREAKDOWN Card
    const card2X = this.margin + cardWidth + cardSpacing;
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(card2X, this.currentY, cardWidth, cardHeight, 3, 3, 'FD');
    
    // Black header text only (no blue background)
    this.pdf.setTextColor(0, 0, 0); // Black text
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('COST BREAKDOWN', card2X + 3, this.currentY + 5);
    
    // Content
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.setFontSize(6);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Material Cost', card2X + 3, this.currentY + 12);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'bold');
    const materialText = this.formatCurrency(basicValue);
    this.pdf.text(materialText, card2X + cardWidth - 3, this.currentY + 12, { align: 'right' });
    
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Transport & Loading', card2X + 3, this.currentY + 18);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'bold');
    const transportText = this.formatCurrency(transportCost);
    this.pdf.text(transportText, card2X + cardWidth - 3, this.currentY + 18, { align: 'right' });
    
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Subtotal', card2X + 3, this.currentY + 24);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'bold');
    const subtotalText = this.formatCurrency(subtotal);
    this.pdf.text(subtotalText, card2X + cardWidth - 3, this.currentY + 24, { align: 'right' });
    
    // TAX & FINAL TOTAL Card
    const card3X = card2X + cardWidth + cardSpacing;
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(card3X, this.currentY, cardWidth, cardHeight, 3, 3, 'FD');
    
    // Black header text only (no blue background)
    this.pdf.setTextColor(0, 0, 0); // Black text
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('TAX & FINAL TOTAL', card3X + 3, this.currentY + 5);
    
    // Content
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.setFontSize(6);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`GST (${Math.round(gstRate * 100)}%)`, card3X + 3, this.currentY + 12);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'bold');
    const gstText = this.formatCurrency(gst);
    this.pdf.text(gstText, card3X + cardWidth - 3, this.currentY + 12, { align: 'right' });
    
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('GRAND TOTAL', card3X + 3, this.currentY + 19);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(7); // Slightly larger for grand total
    const grandTotalText = this.formatCurrency(grandTotal);
    this.pdf.text(grandTotalText, card3X + cardWidth - 3, this.currentY + 19, { align: 'right' });
    
    this.currentY += cardHeight + 10;
    
    // Final Grand Total Banner (Blue with white text)
    const bannerHeight = 14;
    this.pdf.setFillColor(255, 255, 255); // White background
    this.pdf.setDrawColor(0, 0, 0); // Black border
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, this.currentY, tableWidth, bannerHeight, 3, 3, 'FD');
    
    this.pdf.setTextColor(0, 0, 0); // Black text
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('TOTAL QUOTATION VALUE:', this.margin + 6, this.currentY + 5);
    
    this.pdf.setFontSize(14);
    const finalTotalText = this.formatCurrency(grandTotal);
    this.pdf.text(finalTotalText, this.margin + tableWidth - 6, this.currentY + 9, { align: 'right' });
    
    this.currentY += bannerHeight + 15;
  }

  /**
   * Add terms and conditions with clean black and white design
   */
  addTermsAndConditions() {
    this.currentY += 10;
    
    // Clean section header with black border only
    this.pdf.setFillColor(255, 255, 255); // White background
    this.pdf.setDrawColor(0, 0, 0); // Black border
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 10, 3, 3, 'FD');
    
    this.pdf.setTextColor(0, 0, 0); // Black text
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('TERMS & CONDITIONS', this.margin + 8, this.currentY + 7);
    
    this.currentY += 15;
    
    // Clean black and white card-based layout
    const termCategories = [
      {
        title: 'PAYMENT TERMS',
        terms: [
          'Advance Payment: 50% of total amount upon order confirmation',
          'Balance Payment: 50% upon delivery of goods',
          'All payments to be made by cheque/NEFT in favor of ADS SYSTEMS'
        ]
      },
      {
        title: 'DELIVERY & INSTALLATION',
        terms: [
          'Delivery Timeline: 15-20 working days from order confirmation',
          'Installation charges are separate and will be quoted upon request',
          'Site conditions must be ready for installation as per our requirements'
        ]
      },
      {
        title: 'WARRANTY & QUALITY',
        terms: [
          'Manufacturing Warranty: 1 year on manufacturing defects',
          'Hardware Warranty: As per manufacturer\'s warranty terms',
          'Glass breakage and mishandling damages are not covered'
        ]
      },
      {
        title: 'GENERAL TERMS',
        terms: [
          'Quotation Validity: 30 days from the date of issue',
          'Prices are subject to change without prior notice',
          'All disputes subject to local jurisdiction only'
        ]
      }
    ];
    
    // Calculate total height needed
    const totalHeight = termCategories.reduce((height, category) => {
      return height + 18 + (category.terms.length * 5) + 8; // card height + spacing
    }, 0);
    
    // Check if we need a page break
    this.checkPageBreak(totalHeight + 20);
    
    // Render each category with clean styling
    termCategories.forEach((category, categoryIndex) => {
      const cardHeight = 18 + (category.terms.length * 5); // Dynamic height
      
      // Check if this individual card needs a page break
      this.checkPageBreak(cardHeight + 10);
      
      // White card with black border
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(0.5);
      this.pdf.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, cardHeight, 3, 3, 'FD');
      
      // Category title (black text, no blue background)
      this.pdf.setTextColor(0, 0, 0); // Black text
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(category.title, this.margin + 4, this.currentY + 8);
      
      // Category terms with consistent sizing
      let termY = this.currentY + 12;
      category.terms.forEach((term, termIndex) => {
        // Black bullet points
        this.pdf.setFillColor(0, 0, 0);
        this.pdf.circle(this.margin + 8, termY - 1, 1, 'F');
        
        // Term text with proper sizing and fitting
        this.pdf.setTextColor(40, 40, 40);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(8);
        
        const maxWidth = this.pageWidth - 2 * this.margin - 20;
        const lines = this.pdf.splitTextToSize(term, maxWidth);
        
        lines.forEach((line, lineIndex) => {
          this.pdf.text(line, this.margin + 15, termY + (lineIndex * 4));
        });
        
        termY += Math.max(lines.length * 4, 5);
      });
      
      this.currentY += cardHeight + 5; // Spacing between cards
    });
    
    this.currentY += 8;
    
    // Clean signature section
    const sigSectionWidth = this.pageWidth - 2 * this.margin;
    const sigBoxWidth = 70;
    const sigBoxX = this.pageWidth - this.margin - sigBoxWidth;
    
    // Company details box (clean white with black border)
    const companyBoxWidth = sigSectionWidth - sigBoxWidth - 10;
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, this.currentY, companyBoxWidth, 28, 3, 3, 'FD');
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('ADS SYSTEMS', this.margin + 6, this.currentY + 8);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.text('Email: support@adssystem.co.in', this.margin + 6, this.currentY + 14);
    this.pdf.text('Phone: +91 9574544012', this.margin + 6, this.currentY + 19);
    this.pdf.text('Website: www.adssystem.co.in', this.margin + 6, this.currentY + 24);
    
    // Signature box (clean white with blue accent)
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.setDrawColor(41, 128, 185);
    this.pdf.setLineWidth(0.8);
    this.pdf.roundedRect(sigBoxX, this.currentY, sigBoxWidth, 28, 3, 3, 'FD');
    
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(41, 128, 185);
    this.pdf.text('For ADS SYSTEMS', sigBoxX + 6, this.currentY + 9);
    
    // Blue signature line
    this.pdf.setDrawColor(41, 128, 185);
    this.pdf.setLineWidth(0.8);
    this.pdf.line(sigBoxX + 6, this.currentY + 18, sigBoxX + sigBoxWidth - 6, this.currentY + 18);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(80, 80, 80);
    this.pdf.text('Authorized Signatory', sigBoxX + 6, this.currentY + 24);
    
    this.currentY += 35;
  }

  /**
   * Add enhanced professional footer to all pages
   */
  addPageNumbers() {
    const pageCount = this.pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      
      // Footer background
      this.pdf.setFillColor(250, 250, 250); // Very light gray
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(0.3);
      this.pdf.rect(this.margin, this.pageHeight - 18, this.pageWidth - 2 * this.margin, 13, 'FD');
      
      // Top border line
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(0.5);
      this.pdf.line(this.margin, this.pageHeight - 18, this.pageWidth - this.margin, this.pageHeight - 18);
      
      // Company tagline (left)
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.setTextColor(80, 80, 80);
      this.pdf.text('ADS Systems – Crafted for Perfection', this.margin + 3, this.pageHeight - 11);
      
      // Page number (center)
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(60, 60, 60);
      const pageText = `Page ${i} of ${pageCount}`;
      this.pdf.text(pageText, this.pageWidth / 2, this.pageHeight - 11, { align: 'center' });
      
      // Date (right)
      this.pdf.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString('en-IN');
      this.pdf.text(today, this.pageWidth - this.margin - 3, this.pageHeight - 11, { align: 'right' });
      
      // Additional professional touch - small line under page number
      const pageTextWidth = this.pdf.getTextWidth(pageText);
      this.pdf.setDrawColor(100, 100, 100);
      this.pdf.setLineWidth(0.3);
      this.pdf.line((this.pageWidth / 2) - (pageTextWidth / 2), this.pageHeight - 8, 
                    (this.pageWidth / 2) + (pageTextWidth / 2), this.pageHeight - 8);
    }
  }

  // Helper formatting functions
  formatWindowType(type) {
    // Handle null, undefined, or object types
    if (!type) return 'N/A';
    if (typeof type === 'object') return 'Custom Window';
    
    const typeStr = String(type).toLowerCase();
    const types = {
      sliding: 'Sliding Window',
      casement: 'Casement Window',
      bay: 'Bay Window',
      fixed: 'Fixed Window',
      awning: 'Awning Window',
      picture: 'Picture Window',
      doublehung: 'Double Hung Window',
      singlehung: 'Single Hung Window',
      pivot: 'Pivot Window'
    };
    return types[typeStr] || String(type) || 'N/A';
  }

  formatGlassType(glass) {
    if (!glass) return 'N/A';
    if (typeof glass === 'object') return 'N/A';
    const glassStr = String(glass);
    return glassStr.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatFrameMaterial(material) {
    if (!material) return 'N/A';
    if (typeof material === 'object') return 'N/A';
    const materialStr = String(material);
    return materialStr.charAt(0).toUpperCase() + materialStr.slice(1);
  }

  /**
   * Add a subtle horizontal divider between sections
   */
  addSectionDivider() {
    this.currentY += 5;
    this.pdf.setDrawColor(220, 220, 220);
    this.pdf.setLineWidth(0.3);
    const lineWidth = this.pageWidth - 2 * this.margin;
    this.pdf.line(this.margin, this.currentY, this.margin + lineWidth, this.currentY);
    this.currentY += 8;
  }

  /**
   * Format currency with proper symbol and thousand separators
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string like "Rs. 23,650.00"
   */
  formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'Rs. 0.00';
    }
    const num = parseFloat(amount);
    // Format with Indian numbering system (lakhs, crores)
    return 'Rs. ' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Format number with thousand separators
   */
  formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    return parseFloat(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}

// Export a singleton instance
const pdfGenerator = new QuotationPDFGenerator();

/**
 * Main export function for easy use in components
 * @param {Object} quotationData - The quotation data to generate PDF from
 * @returns {Promise<Object>} Result object with success status
 */
export const generateQuotationPDF = async (quotationData) => {
  if (!quotationData || !quotationData.windowSpecs || quotationData.windowSpecs.length === 0) {
    return {
      success: false,
      error: 'No window specifications found. Please add at least one window to generate PDF.'
    };
  }

  return await pdfGenerator.generatePDF(quotationData);
};

export default pdfGenerator;
