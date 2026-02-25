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
            Client & Financial Details
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
            <div style={{ height: '1px', background: '#e5e7eb', margin: '6px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Finalized Fees:</span>
              <span style={{ fontWeight: '700', color: '#059669', fontSize: '16px' }}>
                {formatCurrency(project.finalizedFees)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Total Received:</span>
              <span style={{ fontWeight: '700', color: '#2563eb', fontSize: '16px' }}>
                {formatCurrency(project.totalReceivedFees)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Pending:</span>
              <span style={{ 
                fontWeight: '700', 
                color: (project.finalizedFees - project.totalReceivedFees) > 0 ? '#dc2626' : '#059669',
                fontSize: '16px'
              }}>
                {formatCurrency(project.finalizedFees - project.totalReceivedFees)}
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
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        marginBottom: '30px'
      }}>
        <YearlyDistributionTable 
          projectData={project}
          showTitle={true}
          compact={false}
          associateConfig={percentageConfig}
          customFields={percentageConfig.customFields || []}
          fieldVisibility={percentageConfig.fieldVisibility || {}}
          isEditable={false}
        />
      </div>

      {/* Expense Distribution Table */}
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
          Expense Distribution
        </h3>
        {expenses.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Financial Year</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Month</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Bank</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Drawing</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Site Visit</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Office Mgmt</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, index) => {
                  const total = (expense.amount || 0) + (expense.drawing || 0) + 
                               (expense.siteVisit || 0) + (expense.officeManagement || 0);
                  return (
                    <tr key={index} style={{ 
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937' }}>
                        FY {expense.year}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                        {expense.month}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          background: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {expense.bankName}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>
                        {formatCurrency(expense.amount || 0)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>
                        {formatCurrency(expense.drawing || 0)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>
                        {formatCurrency(expense.siteVisit || 0)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>
                        {formatCurrency(expense.officeManagement || 0)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#fef3c7', borderTop: '2px solid #f59e0b' }}>
                  <td colSpan="3" style={{ padding: '14px', fontWeight: '700', color: '#92400e' }}>
                    Total Expenses
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#92400e' }}>
                    {formatCurrency(expenses.reduce((sum, e) => sum + (e.amount || 0), 0))}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#92400e' }}>
                    {formatCurrency(expenses.reduce((sum, e) => sum + (e.drawing || 0), 0))}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#92400e' }}>
                    {formatCurrency(expenses.reduce((sum, e) => sum + (e.siteVisit || 0), 0))}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#92400e' }}>
                    {formatCurrency(expenses.reduce((sum, e) => sum + (e.officeManagement || 0), 0))}
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right', fontWeight: '700', color: '#92400e', fontSize: '16px' }}>
                    {formatCurrency(expenses.reduce((sum, e) => {
                      return sum + (e.amount || 0) + (e.drawing || 0) + 
                             (e.siteVisit || 0) + (e.officeManagement || 0);
                    }, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: '#9ca3af'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>No expense records available for this project</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default ProjectDetailPage;
