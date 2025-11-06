import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * PIXEL-PERFECT PDF Generator matching reference quotation exactly
 * DO NOT modify spacing, margins, fonts, or layout
 */

class ExactQuotationPDFGenerator {
  constructor() {
    this.pdf = null;
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 15; // Exact margin as reference
    this.currentY = this.margin;
    this.quotationData = null;
  }

  /**
   * Generate PDF matching exact reference layout
   */
  async generatePDF(quotationData) {
    try {
      this.pdf = new jsPDF('p', 'mm', 'a4');
      this.currentY = this.margin;
      this.quotationData = quotationData;

      // Page 1: Header
      this.addExactHeader(quotationData);
      
      // Add each window specification
      for (let i = 0; i < quotationData.windowSpecs.length; i++) {
        // Check if we need new page (after first window)
        if (i > 0 && this.currentY > 220) {
          this.pdf.addPage();
          this.currentY = this.margin;
          this.addExactHeader(quotationData);
        }
        
        await this.addWindowSection(quotationData.windowSpecs[i], i);
      }
      
      // Add pricing/totals section if pricing data exists
      if (quotationData.pricing) {
        // Check if we need new page for pricing
        if (this.currentY > 230) {
          this.pdf.addPage();
          this.currentY = this.margin;
          this.addExactHeader(quotationData);
        }
        this.addPricingSection(quotationData);
      }
      
      // Save PDF
      const fileName = `Quotation_${quotationData.quotationNumber}_${new Date().toISOString().split('T')[0].slice(5).replace('-', '')}_${new Date().toISOString().split('T')[1].slice(0,5).replace(':', '')}.pdf`;
      this.pdf.save(fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add exact header matching reference PDF
   */
  addExactHeader(quotationData) {
    const companyDetails = quotationData?.companyDetails || {
      phone: '9574544012',
      email: 'support@adssystem.co.in',
      website: 'adssystem.co.in',
      gstin: '24APJPP8011N1ZK'
    };

    // White background for entire header area
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.rect(0, 0, this.pageWidth, 40, 'F');

    // ADS SYSTEMS Logo - center-left
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    
    // Calculate center position for logo
    const logoText = 'ADS';
    const logoWidth = this.pdf.getTextWidth(logoText);
    const centerX = this.pageWidth / 2;
    
    this.pdf.text(logoText, centerX - logoWidth / 2, 20);
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    const systemsText = 'SYSTEMS';
    const systemsWidth = this.pdf.getTextWidth(systemsText);
    this.pdf.text(systemsText, centerX - systemsWidth / 2, 27);

    // Contact info - top right
    const rightX = this.pageWidth - this.margin;
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    
    this.pdf.text(`Contact No : ${companyDetails.phone}`, rightX, 12, { align: 'right' });
    this.pdf.text(`Email : ${companyDetails.email}`, rightX, 16, { align: 'right' });
    this.pdf.text(`Website : ${companyDetails.website}`, rightX, 20, { align: 'right' });
    this.pdf.text(`GSTIN : ${companyDetails.gstin}`, rightX, 24, { align: 'right' });

    // Horizontal line below header
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, 32, this.pageWidth - this.margin, 32);

    // Quote information line
    this.currentY = 38;
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    
    const quoteInfo = `Quote No. : XAP-QT-00000161 / Project : ${quotationData.project || 'SWARNIM'} / Date : ${quotationData.date || '01/01/2025'}`;
    this.pdf.text(quoteInfo, this.margin, this.currentY);
    
    this.currentY = 45;
  }

  /**
   * Add window section matching exact reference layout
   */
  async addWindowSection(spec, index) {
    const startY = this.currentY;
    
    // Check if we need new page
    if (this.currentY > 220) {
      this.pdf.addPage();
      this.currentY = this.margin;
      this.addExactHeader(this.quotationData);
    }

    // Top section: Code, Name, Size, Profile, Location, Glass - EXACT as reference
    const topTableY = this.currentY;
    const leftColWidth = 95; // Width for left column
    const rightColWidth = 95; // Width for right column
    
    // Draw outer border for top section
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.3);
    this.pdf.rect(this.margin, topTableY, this.pageWidth - 2 * this.margin, 18, 'D');

    // LEFT SIDE - Code and Name
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Code :', this.margin + 2, topTableY + 4);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(spec.code || spec.id || 'W5', this.margin + 15, topTableY + 4);

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Name :', this.margin + 2, topTableY + 9);
    this.pdf.setFont('helvetica', 'normal');
    const windowName = spec.name || this.formatWindowType(spec.type) || 'VENTILATION';
    this.pdf.text(windowName, this.margin + 15, topTableY + 9);

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Location :', this.margin + 2, topTableY + 14);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(spec.location || 'BEDROOM 3', this.margin + 15, topTableY + 14);

    // Vertical divider
    this.pdf.line(this.margin + leftColWidth, topTableY, this.margin + leftColWidth, topTableY + 18);

    // RIGHT SIDE - Size, Profile, Glass
    const rightX = this.margin + leftColWidth + 2;
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Size :', rightX, topTableY + 4);
    this.pdf.setFont('helvetica', 'normal');
    const width = spec.dimensions?.width || spec.width || '353.00';
    const height = spec.dimensions?.height || spec.height || '1123.00';
    const size = `W = ${width}, H = ${height}`;
    this.pdf.text(size, rightX + 12, topTableY + 4);

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Profile System :', rightX, topTableY + 9);
    this.pdf.setFont('helvetica', 'normal');
    const profileSystem = spec.profileSystem || 'ADS SYSTEM - R 40 CASEMENT SERIES';
    this.pdf.text(profileSystem, rightX + 28, topTableY + 9);

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Glass :', rightX, topTableY + 14);
    this.pdf.setFont('helvetica', 'normal');
    const glassType = this.formatGlassType(spec.specifications?.glassType || spec.glass);
    this.pdf.text(glassType, rightX + 12, topTableY + 14);

    this.currentY = topTableY + 22;

    // MAIN CONTENT AREA - Two columns
    const mainContentY = this.currentY;
    const diagramColWidth = 70; // Left column for diagram
    const valuesColWidth = 115; // Right column for computed values and other tables

    // LEFT COLUMN - Diagram
    const diagramX = this.margin;
    await this.addWindowDiagram(spec, diagramX, diagramColWidth, mainContentY);

    // RIGHT COLUMN - Computed Values
    const valuesX = this.margin + diagramColWidth + 5;
    this.addComputedValuesTable(spec, valuesX, valuesColWidth, mainContentY);

    // Move to position after both columns
    this.currentY = mainContentY + 75;

    // PROFILE AND ACCESSORIES SECTION - Full width
    this.addProfileAndAccessories(spec);

    // Add spacing before next window
    this.currentY += 5;
  }

  /**
   * Add window diagram
   */
  async addWindowDiagram(spec, startX, width, startY) {
    this.currentY = startY;
    
    // Draw border for diagram area
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.setLineWidth(0.3);
    this.pdf.rect(startX, startY, width, 65, 'D');

    // Create diagram
    if (spec.diagramSnapshot) {
      try {
        const imgHeight = 60;
        this.pdf.addImage(spec.diagramSnapshot, 'PNG', startX + 2, startY + 2, width - 4, imgHeight);
      } catch (error) {
        console.warn('Could not add diagram snapshot');
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(150, 150, 150);
        this.pdf.text('[Diagram]', startX + width / 2, startY + 30, { align: 'center' });
      }
    } else {
      // Draw simple diagram representation
      await this.drawSimpleDiagram(spec, startX, startY, width);
    }

    // "View From Inside" text
    this.pdf.setFontSize(7);
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text('View From Inside', startX + width / 2, startY + 70, { align: 'center' });
  }

  /**
   * Draw simple diagram
   */
  async drawSimpleDiagram(spec, startX, startY, width) {
    const height = 60;
    const padding = 5;
    
    // Dimensions text above diagram
    this.pdf.setFontSize(7);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);
    
    const dimWidth = spec.dimensions?.width || spec.width || '353';
    const dimHeight = spec.dimensions?.height || spec.height || '1123';
    
    // Draw dimensions
    this.pdf.text(`${dimHeight}`, startX - 5, startY + height / 2, { align: 'right' });
    this.pdf.text(`${dimWidth}`, startX + width / 2, startY + height + 5, { align: 'center' });

    // Draw window outline
    const rectX = startX + padding + 10;
    const rectY = startY + padding;
    const rectW = width - 2 * padding - 15;
    const rectH = height - 2 * padding;

    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(rectX, rectY, rectW, rectH, 'D');

    // Draw inner details based on window type
    const type = (spec.type || spec.selectedWindowType || 'casement').toLowerCase();
    
    if (type.includes('sliding')) {
      // Sliding panels
      const panelWidth = rectW / 2;
      this.pdf.line(rectX + panelWidth, rectY, rectX + panelWidth, rectY + rectH);
    } else if (type.includes('casement')) {
      // Casement - single sash
      const inset = 3;
      this.pdf.rect(rectX + inset, rectY + inset, rectW - 2 * inset, rectH - 2 * inset, 'D');
    } else if (type.includes('fixed')) {
      // Fixed window - simple frame
      const inset = 3;
      this.pdf.rect(rectX + inset, rectY + inset, rectW - 2 * inset, rectH - 2 * inset, 'D');
    }
  }

  /**
   * Add computed values table - EXACT as reference
   */
  addComputedValuesTable(spec, startX, width, startY) {
    this.currentY = startY;
    
    // Table header - "Computed Values" with blue background
    this.pdf.setFillColor(173, 216, 230); // Light blue
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.3);
    this.pdf.rect(startX, this.currentY, width, 6, 'FD');
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Computed Values', startX + 2, this.currentY + 4);
    
    this.currentY += 6;

    // Extract computed values from spec
    const sqFtPerWindow = spec.computedValues?.sqFtPerWindow || 
                          ((spec.dimensions?.width || 1000) * (spec.dimensions?.height || 1000) / 92903);
    const sqFtPrice = spec.pricing?.sqFtPrice || 450;
    const unitPrice = spec.pricing?.basePrice || (sqFtPerWindow * sqFtPrice);
    const quantity = spec.pricing?.quantity || 1;
    const totalValue = unitPrice * quantity;
    const weight = spec.computedValues?.weight || (sqFtPerWindow * 15);

    // Table rows with actual data
    const rows = [
      ['Sq.Ft. per window', `${sqFtPerWindow.toFixed(3)} Sq.Ft.`],
      ['Value per Sq.Ft.', `${this.formatNumber(sqFtPrice)} INR`],
      ['Unit Price', `${this.formatNumber(unitPrice)} INR`],
      ['Quantity', `${quantity} Pcs`],
      ['Value', `${this.formatNumber(totalValue)} INR`],
      ['Weight', `${weight.toFixed(3)} KG`]
    ];

    const rowHeight = 5;
    const col1Width = width * 0.5;
    const col2Width = width * 0.5;

    rows.forEach((row, index) => {
      const rowY = this.currentY;
      
      // Draw row border
      this.pdf.rect(startX, rowY, width, rowHeight, 'D');
      this.pdf.line(startX + col1Width, rowY, startX + col1Width, rowY + rowHeight);
      
      // Add text
      this.pdf.setFontSize(7);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(row[0], startX + 1, rowY + 3.5);
      this.pdf.text(row[1], startX + col1Width + 1, rowY + 3.5);
      
      this.currentY += rowHeight;
    });
    
    this.currentY += 2;
  }

  /**
   * Add profile and accessories section - EXACT as reference
   */
  addProfileAndAccessories(spec) {
    const tableWidth = this.pageWidth - 2 * this.margin;
    const col1Width = tableWidth * 0.5;
    const col2Width = tableWidth * 0.5;
    
    // Profile section header - blue background
    this.pdf.setFillColor(173, 216, 230);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.3);
    this.pdf.rect(this.margin, this.currentY, col1Width, 6, 'FD');
    
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('Profile', this.margin + 2, this.currentY + 4);
    
    // Accessories section header - blue background
    this.pdf.rect(this.margin + col1Width, this.currentY, col2Width, 6, 'FD');
    this.pdf.text('Accessories', this.margin + col1Width + 2, this.currentY + 4);
    
    this.currentY += 6;

    // Extract specifications
    const specs = spec.specifications || {};
    const frameColor = specs.frameColor || specs.frame?.color || 'MILL FINISH';
    const frameMaterial = specs.frameMaterial || specs.frame?.material || 'Aluminum';
    const hardware = specs.hardware || 'Standard';
    const grilles = specs.grilles || specs.grille?.style || 'No';
    
    // Profile rows with actual data
    const profileRows = [
      [`Profile Color : ${frameColor.toUpperCase()}`, `Locking : ${hardware === 'premium' ? 'Multi-Point' : 'NA'}`],
      [`Mesh Type : ${grilles === 'none' ? 'No' : 'Yes'}`, `Handle color : BLACK`],
      [`Frame Material : ${frameMaterial}`, `Friction : Friction Stay 12 Inch`],
      [`Opening Type : ${specs.openingType || 'Fixed'}`, `Hinge Type : SS Single Point Handle`],
      [`Glass Type : ${this.formatGlassType(specs.glassType)}`, `Security : ${specs.security || 'Standard'}`],
      [`Screen Included : ${specs.screenIncluded ? 'Yes' : 'No'}`, `Motorized : ${specs.motorized ? 'Yes' : 'No'}`],
      [``, ``],
      [`Remarks :`, ``]
    ];

    const rowHeight = 5;

    profileRows.forEach((row, index) => {
      const rowY = this.currentY;
      
      // Draw borders
      this.pdf.rect(this.margin, rowY, col1Width, rowHeight, 'D');
      this.pdf.rect(this.margin + col1Width, rowY, col2Width, rowHeight, 'D');
      
      // Add text
      this.pdf.setFontSize(7);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);
      
      if (row[0]) {
        this.pdf.text(row[0], this.margin + 1, rowY + 3.5);
      }
      if (row[1]) {
        this.pdf.text(row[1], this.margin + col1Width + 1, rowY + 3.5);
      }
      
      this.currentY += rowHeight;
    });
    
    this.currentY += 3;
  }

  /**
   * Format window type to readable text
   */
  formatWindowType(type) {
    if (!type) return 'Custom Window';
    
    const typeMap = {
      'sliding': 'Sliding Window',
      'casement': 'Casement Window',
      'fixed': 'Fixed Window',
      'awning': 'Awning Window',
      'bay': 'Bay Window',
      'picture': 'Picture Window',
      'double-hung': 'Double Hung Window',
      'single-hung': 'Single Hung Window'
    };
    
    const lowerType = String(type).toLowerCase();
    return typeMap[lowerType] || type;
  }

  /**
   * Format glass type to readable text
   */
  formatGlassType(glass) {
    if (!glass) return '5MM CLEAR GLASS';
    
    const glassStr = String(glass).toLowerCase();
    
    if (glassStr.includes('double')) {
      return '(1,2,3) 5MM FROSTED GLASS';
    } else if (glassStr.includes('single')) {
      return '5MM CLEAR GLASS';
    } else if (glassStr.includes('frosted')) {
      return '5MM FROSTED GLASS';
    } else if (glassStr.includes('tinted')) {
      return '5MM TINTED GLASS';
    } else if (glassStr.includes('tempered')) {
      return '6MM TEMPERED GLASS';
    }
    
    return glass;
  }

  /**
   * Format number with commas (Indian format)
   */
  formatNumber(num) {
    if (!num) return '0.00';
    const numStr = parseFloat(num).toFixed(2);
    const parts = numStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /**
   * Add pricing/totals section at the end
   */
  addPricingSection(quotationData) {
    const pricing = quotationData.pricing || {};
    
    // Add spacing before pricing section
    this.currentY += 10;
    
    // Section title
    this.pdf.setFillColor(0, 0, 0);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.3);
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 'FD');
    
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text('PRICING SUMMARY', this.margin + 3, this.currentY + 5.5);
    
    this.currentY += 12;
    
    // Calculate totals from all windows
    let totalWindowsPrice = 0;
    if (quotationData.windowSpecs && quotationData.windowSpecs.length > 0) {
      quotationData.windowSpecs.forEach(spec => {
        const sqFt = spec.computedValues?.sqFtPerWindow || 0;
        const sqFtPrice = spec.pricing?.sqFtPrice || 450;
        const quantity = spec.pricing?.quantity || 1;
        const windowPrice = sqFt * sqFtPrice * quantity;
        totalWindowsPrice += windowPrice;
      });
    }
    
    const subtotal = pricing.subtotal || totalWindowsPrice;
    const transportation = pricing.transportation || 0;
    const loading = pricing.loading || 0;
    const totalBeforeTax = subtotal + transportation + loading;
    const taxRate = pricing.taxRate || 18;
    const tax = pricing.tax || (totalBeforeTax * taxRate / 100);
    const grandTotal = pricing.grandTotal || (totalBeforeTax + tax);
    
    // Pricing rows
    const pricingRows = [
      ['Subtotal (All Windows):', `Rs. ${this.formatNumber(subtotal)}`],
      ['Transportation:', `Rs. ${this.formatNumber(transportation)}`],
      ['Loading/Unloading:', `Rs. ${this.formatNumber(loading)}`],
      ['Total Before Tax:', `Rs. ${this.formatNumber(totalBeforeTax)}`],
      [`GST (${taxRate}%):`, `Rs. ${this.formatNumber(tax)}`],
      ['GRAND TOTAL:', `Rs. ${this.formatNumber(grandTotal)}`]
    ];
    
    const tableWidth = this.pageWidth - 2 * this.margin;
    const col1Width = tableWidth * 0.7;
    const col2Width = tableWidth * 0.3;
    const rowHeight = 7;
    
    pricingRows.forEach((row, index) => {
      const rowY = this.currentY;
      const isLastRow = index === pricingRows.length - 1;
      
      // Special formatting for grand total row
      if (isLastRow) {
        this.pdf.setFillColor(240, 240, 240);
        this.pdf.rect(this.margin, rowY, tableWidth, rowHeight, 'F');
      }
      
      // Draw borders
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(0.3);
      this.pdf.rect(this.margin, rowY, tableWidth, rowHeight, 'D');
      this.pdf.line(this.margin + col1Width, rowY, this.margin + col1Width, rowY + rowHeight);
      
      // Add text
      this.pdf.setFontSize(isLastRow ? 10 : 9);
      this.pdf.setFont('helvetica', isLastRow ? 'bold' : 'normal');
      this.pdf.setTextColor(0, 0, 0);
      
      this.pdf.text(row[0], this.margin + 3, rowY + 5);
      this.pdf.text(row[1], this.margin + tableWidth - 3, rowY + 5, { align: 'right' });
      
      this.currentY += rowHeight;
    });
    
    this.currentY += 5;
  }
}

// Export singleton instance
const exactPDFGenerator = new ExactQuotationPDFGenerator();

export const generateExactQuotationPDF = (quotationData) => {
  return exactPDFGenerator.generatePDF(quotationData);
};

export default ExactQuotationPDFGenerator;
