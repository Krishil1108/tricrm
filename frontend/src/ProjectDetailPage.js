import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaUsers, FaArrowLeft } from 'react-icons/fa';
import { FiCreditCard } from 'react-icons/fi';
import './ProjectPage.css';
import FinanceService from './services/FinanceService';
import ClientService from './services/ClientService';
import AssociateService from './services/AssociateService';
import ConfigurationVersionService from './services/ConfigurationVersionService';
import { useAuth } from './contexts/AuthContext';
import { useLoading } from './contexts/LoadingContext';
import { useToast } from './context/ToastContext';
import YearlyDistributionTable from './components/YearlyDistributionTable';
import AssociateDistributionTable from './components/AssociateDistributionTable';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { canEditProject, canDeleteProject } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const { showSuccess, showError } = useToast();
  
  const [project, setProject] = useState(null);
  const [clients, setClients] = useState([]);
  const [associates, setAssociates] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [percentageConfig, setPercentageConfig] = useState({
    profitMarginPercent: 0,
    drawingPercent: 0,
    documentsPercent: 0,
    siteVisitPercent: 0,
    marketingAndMiscPercent: 0,
    officeManagementPercent: 0,
    customFields: [],
    fieldVisibility: {}
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  useEffect(() => {
    loadProjectData();
    loadPercentageConfig();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProjectData = async () => {
    try {
      showLoading();
      const [projectResponse, clientsData, associatesData, expensesResponse] = await Promise.all([
        FinanceService.getProject(projectId),
        ClientService.getAllClients(),
        AssociateService.getAllAssociates(),
        FinanceService.getAllExpenses()
      ]);
      
      // Handle both direct data and nested response structure
      const projectData = projectResponse.data || projectResponse;
      const expensesData = expensesResponse.data || expensesResponse;
      
      if (!projectData) {
        showError('Project not found');
        navigate('/projects');
        return;
      }
      
      setProject(projectData);
      setClients(clientsData);
      setAssociates(associatesData);
      setExpenses(expensesData.filter(exp => exp.projectId === projectId));
    } catch (error) {
      console.error('Error loading project:', error);
      showError('Failed to load project details');
      navigate('/projects');
    } finally {
      hideLoading();
    }
  };

  const loadPercentageConfig = async () => {
    try {
      const currentConfigData = await ConfigurationVersionService.getCurrentConfiguration();
      if (currentConfigData && currentConfigData.data) {
        const config = currentConfigData.data.configuration;
        const configWithDefaults = {
          profitMarginPercent: config.profitMarginPercent || 0,
          drawingPercent: config.drawingPercent || 0,
          documentsPercent: config.documentsPercent || 0,
          siteVisitPercent: config.siteVisitPercent || 0,
          marketingAndMiscPercent: config.marketingAndMiscPercent || 0,
          officeManagementPercent: config.officeManagementPercent || 0,
          customFields: config.customFields || [],
          fieldVisibility: config.fieldVisibility || {}
        };
        setPercentageConfig(configWithDefaults);
      }
    } catch (error) {
      console.error('Error loading percentage configuration:', error);
    }
  };

  const handleEdit = () => {
    navigate('/projects', { state: { editProjectId: project._id } });
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete project "${project.projectName}"?`)) {
      try {
        showLoading();
        await FinanceService.deleteProject(project._id);
        showSuccess('Project deleted successfully');
        navigate('/projects');
      } catch (error) {
        console.error('Error deleting project:', error);
        showError('Failed to delete project');
      } finally {
        hideLoading();
      }
    }
  };

  const handleAddPayment = async (newPayment, percentages) => {
    try {
      showLoading();
      
      // Add the new payment to the project's payments array
      const updatedPayments = [...(project.payments || []), newPayment];
      
      // Calculate new total received fees
      const newTotalReceived = updatedPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
      
      // Prepare the update data
      const updateData = {
        ...project,
        payments: updatedPayments,
        totalReceivedFees: newTotalReceived,
        // Update percentages if custom ones were provided
        ...(percentages && {
          profitMarginPercent: percentages.profitMarginPercent,
          drawingPercent: percentages.drawingPercent,
          documentsPercent: percentages.documentsPercent,
          siteVisitPercent: percentages.siteVisitPercent,
          marketingAndMiscPercent: percentages.marketingAndMiscPercent,
          officeManagementPercent: percentages.officeManagementPercent
        })
      };
      
      // Update the project
      await FinanceService.updateProject(project._id, updateData);
      
      // Reload the project data
      await loadProjectData();
      
      showSuccess('Payment added successfully');
    } catch (error) {
      console.error('Error adding payment:', error);
      showError('Failed to add payment: ' + (error.response?.data?.message || error.message));
    } finally {
      hideLoading();
    }
  };

  const handleEditPayment = async (paymentIndex, updatedPayment, percentages) => {
    try {
      showLoading();
      
      // Update the payment in the payments array
      const updatedPayments = [...project.payments];
      updatedPayments[paymentIndex] = updatedPayment;
      
      // Calculate new total received fees
      const newTotalReceived = updatedPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
      
      // Prepare the update data
      const updateData = {
        ...project,
        payments: updatedPayments,
        totalReceivedFees: newTotalReceived,
        // Update percentages if custom ones were provided
        ...(percentages && {
          profitMarginPercent: percentages.profitMarginPercent,
          drawingPercent: percentages.drawingPercent,
          documentsPercent: percentages.documentsPercent,
          siteVisitPercent: percentages.siteVisitPercent,
          marketingAndMiscPercent: percentages.marketingAndMiscPercent,
          officeManagementPercent: percentages.officeManagementPercent
        })
      };
      
      // Update the project
      await FinanceService.updateProject(project._id, updateData);
      
      // Reload the project data
      await loadProjectData();
      
      showSuccess('Payment updated successfully');
    } catch (error) {
      console.error('Error updating payment:', error);
      showError('Failed to update payment: ' + (error.response?.data?.message || error.message));
    } finally {
      hideLoading();
    }
  };

  const handleDeletePayment = async (paymentIndex) => {
    try {
      showLoading();
      
      // Remove the payment from the payments array
      const updatedPayments = project.payments.filter((_, index) => index !== paymentIndex);
      
      // Calculate new total received fees
      const newTotalReceived = updatedPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
      
      // Prepare the update data
      const updateData = {
        ...project,
        payments: updatedPayments,
        totalReceivedFees: newTotalReceived
      };
      
      // Update the project
      await FinanceService.updateProject(project._id, updateData);
      
      // Reload the project data
      await loadProjectData();
      
      showSuccess('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      showError('Failed to delete payment: ' + (error.response?.data?.message || error.message));
    } finally {
      hideLoading();
    }
  };


  if (!project) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  const client = clients.find(c => c._id === project.clientId);

  return (
    <div style={{ 
      minHeight: '100vh',
      width: '100%',
      padding: '0',
      margin: '0',
      background: '#f8f9fa'
    }}>
      <div style={{ padding: '20px' }}>
      {/* Header with Action Buttons */}
      <div style={{
        padding: '16px 20px',
        background: '#2c5282',
        color: 'white',
        borderRadius: '6px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <button
              onClick={() => navigate('/projects')}
              style={{
                padding: '6px 14px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            >
              <FaArrowLeft /> Back to Projects
            </button>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '600' }}>
              {project.projectName}
            </h1>
            <p style={{ margin: 0, opacity: 0.85, fontSize: '14px' }}>
              Project #{project.projectNumber}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {canEditProject && (
              <button
                onClick={handleEdit}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              >
                <FaEdit /> Edit Details
              </button>
            )}
            {canDeleteProject && (
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  background: '#dc2626',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
              >
                <FaTrash /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top Section: Client Info, Fees, Associates */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Client & Fees Card */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '18px', 
            fontWeight: '600',
            color: '#1f2937',
            borderBottom: '2px solid #667eea',
            paddingBottom: '10px'
          }}>
            Client & Project Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Client:</span>
              <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                {client?.name || 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Company:</span>
              <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                {client?.company || 'N/A'}
              </span>
            </div>
            <div style={{ height: '1px', background: '#e5e7eb', margin: '6px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Location:</span>
              <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                {project.projectLocation || 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Status:</span>
              <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '')}`}>
                {project.status}
              </span>
            </div>
          </div>
        </div>

        {/* Associates Card */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '18px', 
            fontWeight: '600',
            color: '#1f2937',
            borderBottom: '2px solid #667eea',
            paddingBottom: '10px'
          }}>
            Associate Information
          </h3>
          {project.projectAssociates && project.projectAssociates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {project.projectAssociates.map((assoc, index) => {
                const associateInfo = associates.find(a => a._id === assoc.associateId);
                return (
                  <div key={index} style={{
                    padding: '14px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                        {associateInfo?.name || 'Unknown'}
                      </span>
                      <span style={{ 
                        background: '#667eea', 
                        color: 'white', 
                        padding: '2px 10px', 
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {assoc.percentage}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280' }}>
                      <span>Amount Paid:</span>
                      <span style={{ fontWeight: '600', color: '#059669' }}>
                        {formatCurrency(assoc.amountPaid || 0)}
                      </span>
                    </div>
                    {assoc.paymentGivenDate && (
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                        Date: {new Date(assoc.paymentGivenDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: '#9ca3af'
            }}>
              <FaUsers style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No associates assigned</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Distribution Table */}
      <YearlyDistributionTable 
        projectData={project}
        showTitle={true}
        compact={false}
        associateConfig={percentageConfig}
        customFields={percentageConfig.customFields || []}
        fieldVisibility={percentageConfig.fieldVisibility || {}}
        isEditable={false}
        onAddPayment={handleAddPayment}
        onEditPayment={handleEditPayment}
        onDeletePayment={handleDeletePayment}
      />

      {/* Associate Distribution Table */}
      <AssociateDistributionTable 
        projectData={project}
        associates={associates}
      />
    </div>
    </div>
  );
};

export default ProjectDetailPage;
