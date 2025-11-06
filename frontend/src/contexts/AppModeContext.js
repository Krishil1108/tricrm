import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the three operational modes
export const APP_MODES = {
  TEST: 'test',
  QUOTATION: 'quotation', 
  MANUFACTURER: 'manufacturer'
};

// Mode configuration with descriptions and settings
export const MODE_CONFIG = {
  [APP_MODES.TEST]: {
    name: 'Test Mode',
    description: 'Unlimited configurations for testing purposes',
    primaryColor: '#4CAF50',
    secondaryColor: '#66BB6A',
    lightColor: '#E8F5E8',
    darkColor: '#2E7D32',
    icon: '🧪',
    features: {
      unlimitedConfigurations: true,
      ignoreInventory: true,
      allowExport: true,
      showInventoryWarnings: false
    }
  },
  [APP_MODES.QUOTATION]: {
    name: 'Quotation Mode', 
    description: 'Create quotes without inventory constraints',
    primaryColor: '#2196F3',
    secondaryColor: '#42A5F5',
    lightColor: '#E3F2FD',
    darkColor: '#1976D2',
    icon: '📋',
    features: {
      unlimitedConfigurations: true,
      ignoreInventory: true,
      allowExport: true,
      showInventoryWarnings: true
    }
  },
  [APP_MODES.MANUFACTURER]: {
    name: 'Manufacturer Mode',
    description: 'Real-time inventory validation for production',
    primaryColor: '#8D6E63',
    secondaryColor: '#A1887F',
    lightColor: '#F5F0EB',
    darkColor: '#5D4037',
    icon: '🏭',
    features: {
      unlimitedConfigurations: false,
      ignoreInventory: false,
      allowExport: true,
      showInventoryWarnings: true,
      requireInventoryValidation: true
    }
  }
};

// Create context
const AppModeContext = createContext();

// Provider component
export const AppModeProvider = ({ children }) => {
  const [currentMode, setCurrentMode] = useState(() => {
    // Load saved mode from localStorage or default to TEST
    const savedMode = localStorage.getItem('appMode');
    return savedMode && Object.values(APP_MODES).includes(savedMode) 
      ? savedMode 
      : APP_MODES.TEST;
  });

  // Apply initial theme on mount
  useEffect(() => {
    applyTheme(currentMode);
  }, []);

  // Save mode changes to localStorage and apply theme
  useEffect(() => {
    localStorage.setItem('appMode', currentMode);
    applyTheme(currentMode);
  }, [currentMode]);

  // Apply theme to CSS custom properties
  const applyTheme = (mode) => {
    const config = MODE_CONFIG[mode];
    const root = document.documentElement;
    
    // Set CSS custom properties for theming
    root.style.setProperty('--theme-primary', config.primaryColor);
    root.style.setProperty('--theme-secondary', config.secondaryColor);
    root.style.setProperty('--theme-light', config.lightColor);
    root.style.setProperty('--theme-dark', config.darkColor);
    root.style.setProperty('--theme-mode', mode);
    
    // Add theme class to body for global styling
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '') + ` theme-${mode}`;
  };

  const switchMode = (mode) => {
    if (!Object.values(APP_MODES).includes(mode)) {
      console.error('Invalid mode:', mode);
      return;
    }
    setCurrentMode(mode);
  };

  const getCurrentModeConfig = () => {
    return MODE_CONFIG[currentMode];
  };

  const isFeatureEnabled = (feature) => {
    return MODE_CONFIG[currentMode]?.features[feature] || false;
  };

  // Helper functions for common mode checks
  const canIgnoreInventory = () => isFeatureEnabled('ignoreInventory');
  const shouldShowInventoryWarnings = () => isFeatureEnabled('showInventoryWarnings');
  const requiresInventoryValidation = () => isFeatureEnabled('requireInventoryValidation');
  const allowsUnlimitedConfigurations = () => isFeatureEnabled('unlimitedConfigurations');

  const value = {
    currentMode,
    switchMode,
    getCurrentModeConfig,
    isFeatureEnabled,
    canIgnoreInventory,
    shouldShowInventoryWarnings,
    requiresInventoryValidation,
    allowsUnlimitedConfigurations,
    APP_MODES,
    MODE_CONFIG
  };

  return (
    <AppModeContext.Provider value={value}>
      {children}
    </AppModeContext.Provider>
  );
};

// Hook to use the context
export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};

export default AppModeContext;