// Form Validation Utilities

export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateEmail = (email) => {
  if (!email) return null; // Only validate if provided
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return null; // Only validate if provided
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number (at least 10 digits)';
  }
  return null;
};

export const validateNumber = (value, min, max, fieldName = 'This field') => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (min !== undefined && num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (max !== undefined && num > max) {
    return `${fieldName} must not exceed ${max}`;
  }
  return null;
};

export const validateDimensions = (width, height) => {
  const errors = {};
  
  const widthError = validateNumber(width, 300, 3000, 'Width');
  if (widthError) errors.width = widthError;
  
  const heightError = validateNumber(height, 300, 2500, 'Height');
  if (heightError) errors.height = heightError;
  
  return Object.keys(errors).length > 0 ? errors : null;
};

export const validateQuotationForm = (quotationData) => {
  const errors = {};
  
  // Client Information
  if (!quotationData.clientInfo?.name?.trim()) {
    errors.clientName = 'Client name is required';
  }
  
  if (quotationData.clientInfo?.email) {
    const emailError = validateEmail(quotationData.clientInfo.email);
    if (emailError) errors.clientEmail = emailError;
  }
  
  if (quotationData.clientInfo?.phone) {
    const phoneError = validatePhone(quotationData.clientInfo.phone);
    if (phoneError) errors.clientPhone = phoneError;
  }
  
  // Window Type
  if (!quotationData.selectedWindowType) {
    errors.windowType = 'Please select a window type';
  }
  
  // Window Specifications
  if (!quotationData.windowSpecs?.width) {
    errors.width = 'Window width is required';
  } else {
    const widthError = validateNumber(quotationData.windowSpecs.width, 300, 3000, 'Width');
    if (widthError) errors.width = widthError;
  }
  
  if (!quotationData.windowSpecs?.height) {
    errors.height = 'Window height is required';
  } else {
    const heightError = validateNumber(quotationData.windowSpecs.height, 300, 2500, 'Height');
    if (heightError) errors.height = heightError;
  }
  
  const quantity = parseInt(quotationData.windowSpecs?.quantity);
  if (!quantity || quantity < 1) {
    errors.quantity = 'Quantity must be at least 1';
  } else if (quantity > 50) {
    errors.quantity = 'Quantity cannot exceed 50';
  }
  
  return errors;
};

export const hasValidationErrors = (errors) => {
  return errors && Object.keys(errors).length > 0;
};

export const getErrorMessage = (errors, field) => {
  return errors?.[field] || null;
};

export const scrollToFirstError = (errors) => {
  const firstErrorField = Object.keys(errors)[0];
  if (firstErrorField) {
    const element = document.querySelector(`[name="${firstErrorField}"]`) || 
                   document.querySelector(`[data-field="${firstErrorField}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  }
};
