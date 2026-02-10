class WhatsAppService {
  constructor() {
    this.baseUrl = 'https://api.whatsapp.com/send';
    this.businessUrl = 'https://wa.me';
    this.apiUrl = '/api/whatsapp'; // Your backend API endpoint
  }

  // Validate phone number
  validatePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, error: 'Phone number is required' };
    }

    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid length
    if (cleaned.length < 10) {
      return { isValid: false, error: 'Phone number must be at least 10 digits' };
    }

    if (cleaned.length > 15) {
      return { isValid: false, error: 'Phone number is too long' };
    }

    return { isValid: true, cleaned };
  }

  // Format phone number to international format
  formatPhoneNumber(phone) {
    const validation = this.validatePhoneNumber(phone);
    
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    let cleaned = validation.cleaned;
    
    // Add country code if not present (assuming India +91 as default)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned; // Return without + for WhatsApp Web URL
  }

  // Method 1: Direct URL (Manual sending)
  sendDirectMessage(phoneNumber, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const encodedMessage = encodeURIComponent(message);
      const url = `${this.businessUrl}/${formattedPhone}?text=${encodedMessage}`;
      
      window.open(url, '_blank');
      return { method: 'direct', status: 'opened', phone: formattedPhone };
    } catch (error) {
      console.error('Phone number validation failed:', error);
      throw new Error(`Invalid phone number: ${error.message}`);
    }
  }

  // Method 2: API-based (Automated sending)
  async sendAPIMessage(phoneNumber, message, messageType = 'text') {
    try {
      const response = await fetch(`${this.apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          to: this.formatPhoneNumber(phoneNumber),
          message: message,
          type: messageType
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        return { method: 'api', status: 'sent', messageId: result.messageId };
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('API message sending failed:', error);
      // Fallback to direct method
      return this.sendDirectMessage(phoneNumber, message);
    }
  }

  // Smart sending method - tries API first, falls back to direct
  async sendMessage(phoneNumber, message, options = {}) {
    const { preferDirect = false, messageType = 'text' } = options;
    
    if (preferDirect) {
      return this.sendDirectMessage(phoneNumber, message);
    }
    
    // Try API first, fallback to direct
    try {
      return await this.sendAPIMessage(phoneNumber, message, messageType);
    } catch (error) {
      return this.sendDirectMessage(phoneNumber, message);
    }
  }

  // Generate quotation message template
  generateQuotationMessage(client, quotation) {
    return `
🏢 *TechCorp Solutions*
📋 *Quotation: ${quotation.quotationNumber}*

Dear ${client.name},

Thank you for your interest in our services. Please find your quotation details below:

📅 *Date:* ${new Date(quotation.date).toLocaleDateString()}
🆔 *Quotation ID:* ${quotation.quotationNumber}

*SERVICES:*
${quotation.items ? quotation.items.map(item => 
  `• ${item.description}\n  Qty: ${item.quantity} | Rate: ₹${item.rate} | Amount: ₹${item.amount}`
).join('\n\n') : 'Service details not available'}

💰 *Subtotal:* ₹${quotation.subtotal || quotation.amount || 0}
🧾 *Tax (${quotation.taxRate || 18}%):* ₹${quotation.tax || 0}
*Total Amount: ₹${quotation.total || quotation.amount || 0}*

📞 For any queries, please contact us.
🌐 Visit: www.techcorpsolutions.com

Best regards,
TechCorp Solutions Team
    `.trim();
  }

  // Send quotation with smart routing
  async sendQuotation(client, quotation, preferDirect = false) {
    const message = this.generateQuotationMessage(client, quotation);
    return await this.sendMessage(client.phone, message, { 
      preferDirect, 
      messageType: 'quotation' 
    });
  }

  // Send payment reminder
  sendPaymentReminder(client, invoiceData) {
    const message = `
🏢 *TechCorp Solutions*
💳 *Payment Reminder*

Dear ${client.name},

This is a friendly reminder that payment for Invoice #${invoiceData.invoiceNumber} is due.

📅 *Due Date:* ${new Date(invoiceData.dueDate).toLocaleDateString()}
💰 *Amount Due:* ₹${invoiceData.amount}

Please process the payment at your earliest convenience.

Thank you for your business!

TechCorp Solutions Team
    `.trim();
    
    return this.sendDirectMessage(client.phone, message);
  }

  // Send follow-up message
  sendFollowUp(client, message) {
    const followUpMessage = `
🏢 *TechCorp Solutions*
📞 *Follow-up*

Dear ${client.name},

${message}

If you have any questions, please don't hesitate to reach out.

Best regards,
TechCorp Solutions Team
    `.trim();
    
    return this.sendDirectMessage(client.phone, followUpMessage);
  }

  // Send meeting reminder
  sendMeetingReminder(client, meetingData) {
    const message = `
🏢 *TechCorp Solutions*
📅 *Meeting Reminder*

Dear ${client.name},

This is a reminder about our upcoming meeting:

📅 *Date:* ${new Date(meetingData.date).toLocaleDateString()}
🕐 *Time:* ${meetingData.time}
📍 *Location:* ${meetingData.location || 'Virtual Meeting'}
📝 *Topic:* ${meetingData.topic}

Looking forward to meeting with you!

Best regards,
TechCorp Solutions Team
    `.trim();
    
    return this.sendDirectMessage(client.phone, message);
  }

  // Send quote status update
  sendQuoteStatusUpdate(client, quotation, status) {
    let statusMessage = '';
    let emoji = '';
    
    switch(status.toLowerCase()) {
      case 'accepted':
        statusMessage = 'Your quotation has been accepted! We will proceed with the implementation.';
        emoji = '✅';
        break;
      case 'rejected':
        statusMessage = 'Thank you for considering our quotation. We appreciate your time and would love to work with you in the future.';
        emoji = '📝';
        break;
      case 'pending':
        statusMessage = 'Your quotation is currently under review. We will get back to you soon.';
        emoji = '⏳';
        break;
      case 'expired':
        statusMessage = 'Your quotation has expired. Please let us know if you would like us to prepare a new one.';
        emoji = '⏰';
        break;
      default:
        statusMessage = `Your quotation status has been updated to: ${status}`;
        emoji = '📋';
    }

    const message = `
🏢 *TechCorp Solutions*
${emoji} *Quotation Update*

Dear ${client.name},

${statusMessage}

📋 *Quotation:* ${quotation.quotationNumber}
💰 *Amount:* ₹${quotation.amount || 0}
📅 *Date:* ${new Date(quotation.date || quotation.created).toLocaleDateString()}

Please feel free to contact us if you have any questions.

Best regards,
TechCorp Solutions Team
    `.trim();
    
    return this.sendDirectMessage(client.phone, message);
  }
}

export default new WhatsAppService();