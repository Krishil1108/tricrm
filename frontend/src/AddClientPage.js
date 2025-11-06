import React, { useState } from 'react';
import './PageContent.css';

const AddClientPage = () => {
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    notes: ''
  });
  const [saved, setSaved] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Get existing clients from localStorage
    const existingClients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    // Add new client with ID and timestamp
    const newClient = {
      ...clientData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      status: 'Active'
    };
    
    // Save to localStorage
    const updatedClients = [...existingClients, newClient];
    localStorage.setItem('clients', JSON.stringify(updatedClients));
    
    // Reset form and show success message
    setClientData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      notes: ''
    });
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setClientData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      notes: ''
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Add New Client</h1>
        <p>Enter client information to add them to your database</p>
      </div>
      
      <div className="page-content">
        <div className="add-client-container">
          <form onSubmit={handleSubmit} className="client-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={clientData.name}
                    onChange={handleInputChange}
                    placeholder="Enter client's full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={clientData.email}
                    onChange={handleInputChange}
                    placeholder="client@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={clientData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={clientData.company}
                    onChange={handleInputChange}
                    placeholder="Company name"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Address Information</h3>
              <div className="form-group">
                <label htmlFor="address">Street Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={clientData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={clientData.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={clientData.state}
                    onChange={handleInputChange}
                    placeholder="NY"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="zipCode">ZIP Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={clientData.zipCode}
                    onChange={handleInputChange}
                    placeholder="10001"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Additional Information</h3>
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={clientData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes about the client..."
                  rows="4"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Add Client
              </button>
              <button type="button" onClick={handleReset} className="reset-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                </svg>
                Reset Form
              </button>
            </div>

            {saved && (
              <div className="success-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Client added successfully!
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClientPage;