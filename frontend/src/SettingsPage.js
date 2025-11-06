import React, { useState, useEffect } from 'react';
import { useCompany } from './CompanyContext';
import './PageContent.css';
import './SettingsPage.css';

const SettingsPage = () => {
  const { companyInfo, updateCompanyInfo } = useCompany();
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'Administrator',
    phone: '+1 (555) 123-4567',
    department: 'Management',
    avatar: null,
    bio: 'CRM System Administrator'
  });

  // Company Settings State
  const [companySettings, setCompanySettings] = useState(companyInfo);

  // Display Preferences State
  const [displayPrefs, setDisplayPrefs] = useState({
    theme: localStorage.getItem('theme') || 'light',
    darkMode: localStorage.getItem('darkMode') === 'true' || false,
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    language: 'en',
    itemsPerPage: 50,
    defaultView: 'grid',
    animations: true,
    compactMode: false,
    fontSize: 'medium'
  });

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    systemAlerts: true,
    activityNotifications: true,
    weeklyReports: true,
    marketingEmails: true,
    frequency: 'immediate',
    pushNotifications: true,
    smsNotifications: true,
    desktopNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    notificationHistory: true,
    digestEmails: true
  });

  // Quotation Settings State
  const [quotationSettings, setQuotationSettings] = useState(
    (companyInfo && companyInfo.quotationSettings) || {
      prefix: 'Q',
      startingNumber: 1001,
      currentNumber: 1001,
      separator: '-',
      suffix: '',
      resetPeriod: 'never'
    }
  );

  // Security Settings State
  const [security, setSecurity] = useState({
    twoFactorAuth: true,
    sessionTimeout: '30',
    passwordExpiry: '90',
    loginNotifications: true,
    deviceTracking: true,
    ipWhitelist: true,
    encryptionEnabled: true,
    backupEncryption: true,
    auditLogging: true,
    accessControl: true
  });

  // Data Settings State
  const [dataSettings, setDataSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriod: '90',
    compressionEnabled: true,
    encryptBackups: true,
    cloudSync: true,
    exportFormat: 'json',
    importValidation: true,
    dataValidation: true,
    archiveOldData: true
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    realTimeData: true,
    autoUpdates: true,
    systemLogging: true,
    performanceMonitoring: true,
    errorReporting: true,
    debugMode: false,
    cacheEnabled: true,
    compressionEnabled: true,
    apiRateLimit: '1000',
    maxConcurrentUsers: '100'
  });

  // System Stats State
  const [systemStats, setSystemStats] = useState({
    totalClients: 0,
    totalInventory: 0,
    totalActivities: 0,
    totalQuotes: 0,
    dbSize: 'Loading...',
    lastBackup: 'Loading...',
    uptime: 'Loading...',
    systemHealth: 'Loading...',
    memoryUsage: 'Loading...',
    timestamp: null
  });

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    // Load system statistics immediately
    loadSystemStats();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSystemStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Sync quotationSettings when companyInfo changes
  useEffect(() => {
    if (companyInfo && companyInfo.quotationSettings) {
      setQuotationSettings(companyInfo.quotationSettings);
    }
  }, [companyInfo]);

  const loadSystemStats = async () => {
    try {
      setIsLoadingStats(true);
      setStatsError(null);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/system/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system statistics');
      }

      const data = await response.json();
      setSystemStats(data);
      setIsLoadingStats(false);
    } catch (error) {
      console.error('Error loading system stats:', error);
      setStatsError('Unable to load system statistics');
      setIsLoadingStats(false);
      
      // Fallback to mock data if API fails
      setSystemStats({
        totalClients: '---',
        totalInventory: '---',
        totalActivities: '---',
        totalQuotes: '---',
        dbSize: 'N/A',
        lastBackup: 'N/A',
        uptime: 'N/A',
        systemHealth: 'Unknown',
        memoryUsage: 'N/A',
        timestamp: null
      });
    }
  };

  const handleSave = (section, data) => {
    switch (section) {
      case 'profile':
        setUserProfile(data);
        break;
      case 'company':
        setCompanySettings(data);
        updateCompanyInfo(data);
        break;
      case 'quotation':
        setQuotationSettings(data);
        updateCompanyInfo({ quotationSettings: data });
        break;
      case 'display':
        setDisplayPrefs(data);
        localStorage.setItem('displayPrefs', JSON.stringify(data));
        // Apply theme changes immediately
        applyTheme(data.theme);
        break;
      case 'notifications':
        setNotifications(data);
        localStorage.setItem('notificationSettings', JSON.stringify(data));
        break;
      case 'security':
        setSecurity(data);
        localStorage.setItem('securitySettings', JSON.stringify(data));
        break;
      case 'data':
        setDataSettings(data);
        localStorage.setItem('dataSettings', JSON.stringify(data));
        break;
      case 'system':
        setSystemSettings(data);
        localStorage.setItem('systemSettings', JSON.stringify(data));
        break;
      default:
        console.warn('Unknown settings section:', section);
    }
    
    // Show success message
    alert(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
  };

  // Function to apply theme
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  // Apply theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || displayPrefs.theme;
    applyTheme(savedTheme);
    
    // Update display preferences if theme was loaded from localStorage
    if (savedTheme !== displayPrefs.theme) {
      setDisplayPrefs(prev => ({ ...prev, theme: savedTheme }));
    }
  }, []);

  const renderProfileSection = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          User Profile
        </h2>
        <p>Manage your personal information and account settings</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSave('profile', userProfile);
      }} className="settings-form">
        <div className="form-row">
          <div className="form-group">
            <label>Profile Picture</label>
            <div className="avatar-upload">
              <div className="avatar-preview">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt="Avatar" />
                ) : (
                  <div className="avatar-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="avatar-input" />
              <span className="upload-text">Click to upload</span>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={userProfile.name}
              onChange={(e) => setUserProfile(prev => ({...prev, name: e.target.value}))}
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={userProfile.email}
              onChange={(e) => setUserProfile(prev => ({...prev, email: e.target.value}))}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Role</label>
            <select
              value={userProfile.role}
              onChange={(e) => setUserProfile(prev => ({...prev, role: e.target.value}))}
            >
              <option value="Administrator">Administrator</option>
              <option value="Manager">Manager</option>
              <option value="User">User</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              value={userProfile.department}
              onChange={(e) => setUserProfile(prev => ({...prev, department: e.target.value}))}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={userProfile.phone}
              onChange={(e) => setUserProfile(prev => ({...prev, phone: e.target.value}))}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Bio</label>
          <textarea
            value={userProfile.bio}
            onChange={(e) => setUserProfile(prev => ({...prev, bio: e.target.value}))}
            rows="3"
            placeholder="Tell us about yourself..."
          />
        </div>

        <button type="submit" className="save-btn">Save Profile</button>
      </form>
    </div>
  );

  const renderCompanySection = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18"/>
            <path d="M5 21V7l8-4v18"/>
            <path d="M19 21V11l-6-4"/>
            <rect x="9" y="9" width="4" height="4"/>
            <circle cx="9" cy="9" r="2"/>
          </svg>
          Company Settings
        </h2>
        <p>Update your company information and branding</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSave('company', companySettings);
      }} className="settings-form">
        <div className="form-row">
          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              value={companySettings.name}
              onChange={(e) => setCompanySettings(prev => ({...prev, name: e.target.value}))}
              required
            />
          </div>
          <div className="form-group">
            <label>Industry</label>
            <select
              value={companySettings.industry || 'technology'}
              onChange={(e) => setCompanySettings(prev => ({...prev, industry: e.target.value}))}
            >
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Finance</option>
              <option value="retail">Retail</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Company Tagline</label>
          <input
            type="text"
            value={companySettings.tagline}
            onChange={(e) => setCompanySettings(prev => ({...prev, tagline: e.target.value}))}
            placeholder="Enter company tagline"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Website</label>
            <input
              type="url"
              value={companySettings.website || ''}
              onChange={(e) => setCompanySettings(prev => ({...prev, website: e.target.value}))}
              placeholder="https://www.example.com"
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={companySettings.phone || ''}
              onChange={(e) => setCompanySettings(prev => ({...prev, phone: e.target.value}))}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={companySettings.email || ''}
            onChange={(e) => setCompanySettings(prev => ({...prev, email: e.target.value}))}
            placeholder="info@company.com"
          />
        </div>

        <div className="form-group">
          <label>Address</label>
          <textarea
            value={companySettings.address || ''}
            onChange={(e) => setCompanySettings(prev => ({...prev, address: e.target.value}))}
            rows="3"
            placeholder="Enter company address"
          />
        </div>

        <button type="submit" className="save-btn">Save Company Settings</button>
      </form>
    </div>
  );

  const renderQuotationSection = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
          Quotation Settings
        </h2>
        <p>Configure quotation numbering and formatting preferences</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSave('quotation', quotationSettings);
      }} className="settings-form">
        <div className="form-row">
          <div className="form-group">
            <label>Quotation Prefix</label>
            <input
              type="text"
              value={quotationSettings.prefix}
              onChange={(e) => setQuotationSettings(prev => ({...prev, prefix: e.target.value}))}
              placeholder="Q"
              maxLength="5"
            />
            <small>Prefix for quotation numbers (e.g., Q, QUOTE, EST)</small>
          </div>
          <div className="form-group">
            <label>Separator</label>
            <select
              value={quotationSettings.separator}
              onChange={(e) => setQuotationSettings(prev => ({...prev, separator: e.target.value}))}
            >
              <option value="-">Dash (-)</option>
              <option value="">None</option>
              <option value="/">Slash (/)</option>
              <option value="_">Underscore (_)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Starting Number</label>
            <input
              type="number"
              value={quotationSettings.startingNumber}
              onChange={(e) => setQuotationSettings(prev => ({...prev, startingNumber: parseInt(e.target.value) || 1001}))}
              min="1"
            />
            <small>The first quotation number to use</small>
          </div>
          <div className="form-group">
            <label>Current Number</label>
            <input
              type="number"
              value={quotationSettings.currentNumber}
              onChange={(e) => setQuotationSettings(prev => ({...prev, currentNumber: parseInt(e.target.value) || 1001}))}
              min="1"
            />
            <small>Next quotation number to be generated</small>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Suffix (Optional)</label>
            <input
              type="text"
              value={quotationSettings.suffix}
              onChange={(e) => setQuotationSettings(prev => ({...prev, suffix: e.target.value}))}
              placeholder=""
              maxLength="10"
            />
            <small>Optional suffix for quotation numbers</small>
          </div>
          <div className="form-group">
            <label>Reset Period</label>
            <select
              value={quotationSettings.resetPeriod}
              onChange={(e) => setQuotationSettings(prev => ({...prev, resetPeriod: e.target.value}))}
            >
              <option value="never">Never</option>
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
            </select>
            <small>When to reset quotation numbers</small>
          </div>
        </div>

        <div className="form-group preview-section">
          <label>Preview Format</label>
          <div className="quotation-preview">
            <strong>Next quotation number: </strong>
            <span className="preview-number">
              {quotationSettings.prefix}
              {quotationSettings.separator && quotationSettings.prefix ? quotationSettings.separator : ''}
              {quotationSettings.currentNumber.toString().padStart(4, '0')}
              {quotationSettings.suffix ? quotationSettings.separator + quotationSettings.suffix : ''}
            </span>
          </div>
        </div>

        <button type="submit" className="save-btn">Save Quotation Settings</button>
      </form>
    </div>
  );

  const renderDisplaySection = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5"/>
            <circle cx="17.5" cy="10.5" r=".5"/>
            <circle cx="8.5" cy="7.5" r=".5"/>
            <circle cx="6.5" cy="12.5" r=".5"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
          Display & Theme
        </h2>
        <p>Customize the appearance and behavior of your CRM</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSave('display', displayPrefs);
      }} className="settings-form">
        <div className="form-row">
          <div className="form-group">
            <label>Theme</label>
            <div className="theme-selector">
              <label className="theme-option">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={displayPrefs.theme === 'light'}
                  onChange={(e) => {
                    const newPrefs = {...displayPrefs, theme: e.target.value};
                    setDisplayPrefs(newPrefs);
                    applyTheme(e.target.value);
                    localStorage.setItem('displayPrefs', JSON.stringify(newPrefs));
                  }}
                />
                <span className="theme-preview light-theme">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                  Light
                </span>
              </label>
              <label className="theme-option">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={displayPrefs.theme === 'dark'}
                  onChange={(e) => {
                    const newPrefs = {...displayPrefs, theme: e.target.value};
                    setDisplayPrefs(newPrefs);
                    applyTheme(e.target.value);
                    localStorage.setItem('displayPrefs', JSON.stringify(newPrefs));
                  }}
                />
                <span className="theme-preview dark-theme">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  Dark
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Timezone</label>
            <select
              value={displayPrefs.timezone}
              onChange={(e) => setDisplayPrefs(prev => ({...prev, timezone: e.target.value}))}
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date Format</label>
            <select
              value={displayPrefs.dateFormat}
              onChange={(e) => setDisplayPrefs(prev => ({...prev, dateFormat: e.target.value}))}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Items Per Page</label>
            <select
              value={displayPrefs.itemsPerPage}
              onChange={(e) => setDisplayPrefs(prev => ({...prev, itemsPerPage: parseInt(e.target.value)}))}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="form-group">
            <label>Default View</label>
            <select
              value={displayPrefs.defaultView}
              onChange={(e) => setDisplayPrefs(prev => ({...prev, defaultView: e.target.value}))}
            >
              <option value="grid">Grid View</option>
              <option value="list">List View</option>
              <option value="card">Card View</option>
            </select>
          </div>
        </div>

        <button type="submit" className="save-btn">Save Display Settings</button>
      </form>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          Notifications
        </h2>
        <p>Manage how and when you receive notifications</p>
      </div>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSave('notifications', notifications);
      }} className="settings-form">
        <div className="notification-toggles">
          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={notifications.emailNotifications}
                onChange={(e) => setNotifications(prev => ({...prev, emailNotifications: e.target.checked}))}
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <h4>Email Notifications</h4>
                <p>Receive important updates via email</p>
              </div>
            </label>
          </div>

          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={notifications.systemAlerts}
                onChange={(e) => setNotifications(prev => ({...prev, systemAlerts: e.target.checked}))}
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <h4>System Alerts</h4>
                <p>Get notified about system events and errors</p>
              </div>
            </label>
          </div>

          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={notifications.activityNotifications}
                onChange={(e) => setNotifications(prev => ({...prev, activityNotifications: e.target.checked}))}
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <h4>Activity Notifications</h4>
                <p>Updates on client and inventory activities</p>
              </div>
            </label>
          </div>

          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={notifications.weeklyReports}
                onChange={(e) => setNotifications(prev => ({...prev, weeklyReports: e.target.checked}))}
              />
              <span className="toggle-slider"></span>
              <div className="toggle-content">
                <h4>Weekly Reports</h4>
                <p>Receive weekly summary reports</p>
              </div>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Notification Frequency</label>
          <select
            value={notifications.frequency}
            onChange={(e) => setNotifications(prev => ({...prev, frequency: e.target.value}))}
          >
            <option value="immediate">Immediate</option>
            <option value="hourly">Hourly Digest</option>
            <option value="daily">Daily Digest</option>
            <option value="weekly">Weekly Digest</option>
          </select>
        </div>

        <button type="submit" className="save-btn">Save Notification Settings</button>
      </form>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          Security & Privacy
        </h2>
        <p>Manage your account security and privacy settings</p>
      </div>
      
      <div className="settings-form">
        <div className="security-card">
          <h4>Password & Authentication</h4>
          <div className="security-actions">
            <button className="security-btn">Change Password</button>
            <div className="toggle-item">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={security.twoFactorAuth}
                  onChange={(e) => setSecurity(prev => ({...prev, twoFactorAuth: e.target.checked}))}
                />
                <span className="toggle-slider"></span>
                <span>Enable Two-Factor Authentication</span>
              </label>
            </div>
          </div>
        </div>

        <div className="security-card">
          <h4>Session Management</h4>
          <div className="form-group">
            <label>Session Timeout (minutes)</label>
            <select
              value={security.sessionTimeout}
              onChange={(e) => setSecurity(prev => ({...prev, sessionTimeout: e.target.value}))}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="240">4 hours</option>
              <option value="480">8 hours</option>
            </select>
          </div>
          <button className="security-btn">View Active Sessions</button>
        </div>

        <div className="security-card">
          <h4>Privacy Settings</h4>
          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={security.loginNotifications}
                onChange={(e) => setSecurity(prev => ({...prev, loginNotifications: e.target.checked}))}
              />
              <span className="toggle-slider"></span>
              <span>Notify me of new login attempts</span>
            </label>
          </div>
          <div className="toggle-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={security.deviceTracking}
                onChange={(e) => setSecurity(prev => ({...prev, deviceTracking: e.target.checked}))}
              />
              <span className="toggle-slider"></span>
              <span>Track device locations for security</span>
            </label>
          </div>
        </div>

        <button 
          onClick={() => handleSave('security', security)} 
          className="save-btn"
        >
          Save Security Settings
        </button>
      </div>
    </div>
  );

  const renderDataSection = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
          </svg>
          Data Management
        </h2>
        <p>Import, export, and manage your CRM data</p>
      </div>
      
      <div className="settings-form">
        <div className="data-card">
          <h4>Import & Export</h4>
          <div className="data-actions">
            <button className="data-btn export-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export All Data
            </button>
            <button className="data-btn import-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Import Data
            </button>
            <button className="data-btn backup-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              Create Backup
            </button>
          </div>
          <p className="data-note">
            Last backup: {systemStats.lastBackup}
          </p>
        </div>

        <div className="data-card">
          <h4>Database Cleanup</h4>
          <div className="cleanup-actions">
            <button className="cleanup-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Clean Old Activities ({'>'}1 year)
            </button>
            <button className="cleanup-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
              </svg>
              Optimize Database
            </button>
            <button className="cleanup-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/>
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
              </svg>
              Generate Analytics Report
            </button>
          </div>
        </div>

        <div className="data-card danger-zone">
          <h4>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Danger Zone
          </h4>
          <p>These actions cannot be undone</p>
          <div className="danger-actions">
            <button className="danger-btn">
              Reset All Settings
            </button>
            <button className="danger-btn">
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSection = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-6.5L19 4.5m-2.5 2.5L19 19.5M4.5 4.5 7 7m-2.5 9.5L7 14"/>
          </svg>
          System Information
        </h2>
        <p>View system statistics and performance metrics</p>
        
        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={loadSystemStats} 
            disabled={isLoadingStats}
            style={{
              padding: '8px 16px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoadingStats ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isLoadingStats ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{
                animation: isLoadingStats ? 'spin 1s linear infinite' : 'none'
              }}
            >
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            {isLoadingStats ? 'Refreshing...' : 'Refresh Now'}
          </button>
          
          {systemStats.timestamp && !isLoadingStats && (
            <span style={{ fontSize: '12px', color: '#666' }}>
              Last updated: {new Date(systemStats.timestamp).toLocaleTimeString()}
            </span>
          )}
          
          {statsError && (
            <span style={{ fontSize: '12px', color: '#dc3545' }}>
              ⚠️ {statsError}
            </span>
          )}
          
          {!statsError && !isLoadingStats && (
            <span style={{ fontSize: '12px', color: '#28a745' }}>
              🟢 Auto-refresh: 30s
            </span>
          )}
        </div>
      </div>
      
      <div className="system-stats">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{isLoadingStats ? '...' : systemStats.totalClients}</h3>
              <p>Total Clients</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{isLoadingStats ? '...' : systemStats.totalInventory}</h3>
              <p>Inventory Items</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{isLoadingStats ? '...' : systemStats.totalActivities}</h3>
              <p>Activities Logged</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="12" x2="2" y2="12"/>
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                <line x1="6" y1="16" x2="6.01" y2="16"/>
                <line x1="10" y1="16" x2="10.01" y2="16"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>{isLoadingStats ? '...' : systemStats.dbSize}</h3>
              <p>Database Size</p>
            </div>
          </div>
        </div>

        <div className="system-info">
          <h4>System Status</h4>
          <div className="status-item">
            <span className="status-label">Uptime:</span>
            <span className="status-value">{isLoadingStats ? 'Loading...' : systemStats.uptime}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Last Backup:</span>
            <span className="status-value">{isLoadingStats ? 'Loading...' : systemStats.lastBackup}</span>
          </div>
          <div className="status-item">
            <span className="status-label">System Health:</span>
            <span className={`status-value ${systemStats.systemHealth === 'Excellent' ? 'status-good' : ''}`}>
              {isLoadingStats ? 'Loading...' : systemStats.systemHealth}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Memory Usage:</span>
            <span className="status-value">{isLoadingStats ? 'Loading...' : systemStats.memoryUsage}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const sections = [
    { 
      key: 'profile', 
      label: (
        <span className="nav-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Profile
        </span>
      ), 
      component: renderProfileSection 
    },
    { 
      key: 'company', 
      label: (
        <span className="nav-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18"/>
            <path d="M5 21V7l8-4v18"/>
            <path d="M19 21V11l-6-4"/>
          </svg>
          Company
        </span>
      ), 
      component: renderCompanySection 
    },
    { 
      key: 'quotation', 
      label: (
        <span className="nav-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Quotation
        </span>
      ), 
      component: renderQuotationSection 
    },
    { 
      key: 'display', 
      label: (
        <span className="nav-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
          Display
        </span>
      ), 
      component: renderDisplaySection 
    },
    { 
      key: 'notifications', 
      label: (
        <span className="nav-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          Notifications
        </span>
      ), 
      component: renderNotificationsSection 
    },
    { 
      key: 'security', 
      label: (
        <span className="nav-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Security
        </span>
      ), 
      component: renderSecuritySection 
    },
    { 
      key: 'data', 
      label: (
        <span className="nav-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
          </svg>
          Data
        </span>
      ), 
      component: renderDataSection 
    },
    { 
      key: 'system', 
      label: (
        <span className="nav-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6"/>
          </svg>
          System
        </span>
      ), 
      component: renderSystemSection 
    },
  ];

  return (
    <div className="page-container settings-page">
      <div className="page-header">
        <h1>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
        </h1>
        <p>Manage your account, company, and system preferences</p>
      </div>
      
      <div className="settings-layout">
        {/* Settings Navigation */}
        <div className="settings-nav">
          <div className="nav-header">
            <h3>Settings</h3>
          </div>
          <div className="nav-items">
            {sections.map(section => (
              <button
                key={section.key}
                className={`nav-item ${activeSection === section.key ? 'active' : ''}`}
                onClick={() => setActiveSection(section.key)}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {sections.find(s => s.key === activeSection)?.component()}
          
          {/* Success Message */}
          {saved && saveMessage && (
            <div className="success-message">
              ✅ {saveMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;