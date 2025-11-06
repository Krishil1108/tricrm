import React, { createContext, useContext, useState, useEffect } from 'react';

const CompanyContext = createContext();

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

export const CompanyProvider = ({ children }) => {
  const [companyInfo, setCompanyInfo] = useState({
    name: 'TechCorp Solutions',
    logo: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
      </svg>
    ),
    tagline: 'Your Business, Our Technology',
    phone: '(555) 123-4567',
    address: '123 Business Street, City, State 12345',
    website: 'www.techcorp.com',
    email: 'info@techcorp.com',
    industry: 'technology',
    quotationSettings: {
      prefix: 'Q',
      startingNumber: 1001,
      currentNumber: 1001,
      separator: '-',
      suffix: '',
      resetPeriod: 'never' // never, yearly, monthly
    }
  });

  // Load company info from localStorage on component mount
  useEffect(() => {
    const savedCompanyInfo = localStorage.getItem('companyInfo');
    if (savedCompanyInfo) {
      try {
        const parsedInfo = JSON.parse(savedCompanyInfo);
        
        // Restore the default logo since it can't be saved
        const defaultLogo = (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
          </svg>
        );
        
        // Ensure quotationSettings exists with defaults
        const mergedInfo = {
          ...parsedInfo,
          logo: defaultLogo, // Restore default logo
          quotationSettings: parsedInfo.quotationSettings || {
            prefix: 'Q',
            startingNumber: 1001,
            currentNumber: 1001,
            separator: '-',
            suffix: '',
            resetPeriod: 'never'
          }
        };
        setCompanyInfo(mergedInfo);
      } catch (error) {
        console.error('Error loading company info from localStorage:', error);
      }
    }
  }, []);

  // Save company info to localStorage whenever it changes
  const updateCompanyInfo = (newInfo) => {
    const updatedInfo = { ...companyInfo, ...newInfo };
    setCompanyInfo(updatedInfo);
    
    // Create a copy without the logo (React component) for localStorage
    const { logo, ...serializableInfo } = updatedInfo;
    try {
      localStorage.setItem('companyInfo', JSON.stringify(serializableInfo));
    } catch (error) {
      console.error('Error saving company info to localStorage:', error);
    }
  };

  // Generate next quotation number and increment counter
  const getNextQuotationNumber = () => {
    // Ensure quotationSettings exists with default values
    const quotationSettings = companyInfo.quotationSettings || {
      prefix: 'Q',
      startingNumber: 1001,
      currentNumber: 1001,
      separator: '-',
      suffix: '',
      resetPeriod: 'never'
    };
    
    const currentNumber = quotationSettings.currentNumber;
    
    // Format the quotation number
    let quotationNumber = quotationSettings.prefix;
    if (quotationSettings.separator && quotationSettings.prefix) {
      quotationNumber += quotationSettings.separator;
    }
    quotationNumber += currentNumber.toString().padStart(4, '0');
    if (quotationSettings.suffix) {
      quotationNumber += quotationSettings.separator + quotationSettings.suffix;
    }

    // Increment the counter for next time
    const updatedQuotationSettings = {
      ...quotationSettings,
      currentNumber: currentNumber + 1
    };
    
    updateCompanyInfo({ quotationSettings: updatedQuotationSettings });
    
    return quotationNumber;
  };

  const value = {
    companyInfo,
    updateCompanyInfo,
    getNextQuotationNumber,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};