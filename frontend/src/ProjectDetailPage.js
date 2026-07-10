// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaEdit, FaTrash, FaUsers, FaArrowLeft } from 'react-icons/fa';
// eslint-disable-next-line no-unused-vars
import { FiCreditCard } from 'react-icons/fi';
import './ProjectPage.css';
import FinanceService from './services/FinanceService';
import ClientService from './services/ClientService';
import AssociateService from './services/AssociateService';
import ConfigurationVersionService from './services/ConfigurationVersionService';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './context/ToastContext';
import YearlyDistributionTable from './components/YearlyDistributionTable';
import AssociateDistributionTable from './components/AssociateDistributionTable';

// Memoized components for better performance
const MemoizedYearlyDistributionTable = React.memo(YearlyDistributionTable);
const MemoizedAssociateDistributionTable = React.memo(AssociateDistributionTable);

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Use name passed via navigation state for instant LCP render (before API responds)
  const cachedProjectName = location.state?.projectName || null;
  const autoOpenAddPayment = new URLSearchParams(location.search).get('addPayment') === 'true';
  const { canEditProject, canDeleteProject } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [associates, setAssociates] = useState([]);
  const [allAssociatesList, setAllAssociatesList] = useState([]);
  const [showAddAssociateModal, setShowAddAssociateModal] = useState(false);
  const [editAssocIndex, setEditAssocIndex] = useState(null); // null = add mode, number = edit mode
  const [addAssocForm, setAddAssocForm] = useState({ associateId: '', percentage: '', amountPaid: '', paymentGivenDate: '', paymentGivenBank: '' });
  const [savingAssociate, setSavingAssociate] = useState(false);
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
    loadAllData();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    AssociateService.getAllAssociates()
      .then(data => setAllAssociatesList(data || []))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAllData = async () => {
    try {
      // Fetch project and global config in parallel (no dependency between them)
      const [projectResponse, configResponse] = await Promise.all([
        FinanceService.getProject(projectId),
        ConfigurationVersionService.getCurrentConfiguration().catch(() => null)
      ]);

      const projectData = projectResponse.data || projectResponse;

      if (!projectData) {
        showError('Project not found');
        navigate('/projects');
        return;
      }

      // Apply config immediately
      if (configResponse && configResponse.data) {
        const config = configResponse.data.configuration;
        setPercentageConfig({
          profitMarginPercent: config.profitMarginPercent || 0,
          drawingPercent: config.drawingPercent || 0,
          documentsPercent: config.documentsPercent || 0,
          siteVisitPercent: config.siteVisitPercent || 0,
          marketingAndMiscPercent: config.marketingAndMiscPercent || 0,
          officeManagementPercent: config.officeManagementPercent || 0,
          customFields: config.customFields || [],
          fieldVisibility: config.fieldVisibility || {}
        });
      }

      // Render project immediately — removes one full round-trip delay
      setProject(projectData);

      // Fetch client + all associates in parallel (depends on projectData)
      const secondaryPromises = [];

      if (projectData.clientId) {
        secondaryPromises.push(
          ClientService.getClient(projectData.clientId)
            .then(data => ({ type: 'client', data }))
            .catch(() => ({ type: 'client', data: null }))
        );
      }

      if (projectData.projectAssociates && projectData.projectAssociates.length > 0) {
        projectData.projectAssociates.forEach(a => {
          secondaryPromises.push(
            AssociateService.getAssociate(a.associateId)
              .then(data => ({ type: 'associate', data }))
              .catch(() => ({ type: 'associate', data: null }))
          );
        });
      }

      if (secondaryPromises.length > 0) {
        const results = await Promise.all(secondaryPromises);
        const associatesData = [];
        results.forEach(result => {
          if (result.type === 'client' && result.data) {
            setClient(result.data);
          } else if (result.type === 'associate' && result.data) {
            associatesData.push(result.data);
          }
        });
        setAssociates(associatesData);
      }

    } catch (error) {
      console.error('Error loading project:', error);
      showError('Failed to load project details');
      navigate('/projects');
    }
  };

  const handleEdit = () => {
    navigate('/projects', { state: { editProjectId: project._id, returnTo: location.pathname } });
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete project "${project.projectName}"?`)) {
      try {
        await FinanceService.deleteProject(project._id);
        showSuccess('Project deleted successfully');
        navigate('/projects');
      } catch (error) {
        console.error('Error deleting project:', error);
        showError('Failed to delete project');
      }
    }
  };

  const handleAddPayment = async (newPayment, percentages) => {
    try {
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
      
      // Optimistically update local state
      setProject(updateData);
      
      // Update the project in backend
      await FinanceService.updateProject(project._id, updateData);
      
      showSuccess('Payment added successfully');
    } catch (error) {
      console.error('Error adding payment:', error);
      showError('Failed to add payment: ' + (error.response?.data?.message || error.message));
      // Reload on error to restore correct state
      await loadAllData();
    }
  };

  const handleEditPayment = async (paymentIndex, updatedPayment, percentages) => {
    try {
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
      
      // Optimistically update local state
      setProject(updateData);
      
      // Update the project in backend
      await FinanceService.updateProject(project._id, updateData);
      
      showSuccess('Payment updated successfully');
    } catch (error) {
      console.error('Error updating payment:', error);
      showError('Failed to update payment: ' + (error.response?.data?.message || error.message));
      // Reload on error to restore correct state
      await loadAllData();
    }
  };

  const handleDeletePayment = async (paymentIndex) => {
    try {
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
      
      // Optimistically update local state
      setProject(updateData);
      
      // Update the project in backend
      await FinanceService.updateProject(project._id, updateData);
      
      showSuccess('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      showError('Failed to delete payment: ' + (error.response?.data?.message || error.message));
      // Reload on error to restore correct state
      await loadAllData();
    }
  };

  const handleSaveAssociate = async () => {
    if (!addAssocForm.associateId) {
      showError('Please select an associate');
      return;
    }
    const pct = parseFloat(addAssocForm.percentage);
    if (!pct || pct <= 0 || pct > 100) {
      showError('Please enter a valid percentage (1–100)');
      return;
    }
    setSavingAssociate(true);
    try {
      const newEntry = {
        associateId: addAssocForm.associateId,
        percentage: pct,
        amountPaid: parseFloat(addAssocForm.amountPaid) || 0,
        paymentGivenDate: addAssocForm.paymentGivenDate || null,
        paymentGivenBank: addAssocForm.paymentGivenBank || ''
      };
      const updatedAssociates = [...(project.projectAssociates || []), newEntry];
      await FinanceService.updateProject(project._id, { ...project, projectAssociates: updatedAssociates });
      setProject(prev => ({ ...prev, projectAssociates: updatedAssociates }));
      setShowAddAssociateModal(false);
      setAddAssocForm({ associateId: '', percentage: '', amountPaid: '', paymentGivenDate: '', paymentGivenBank: '' });
      showSuccess('Associate added successfully');
      loadAllData();
    } catch (error) {
      console.error('Error adding associate:', error);
      showError('Failed to add associate: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingAssociate(false);
    }
  };

  const openEditAssociate = (index) => {
    const assoc = project.projectAssociates[index];
    setEditAssocIndex(index);
    setAddAssocForm({
      associateId: assoc.associateId || '',
      percentage: assoc.percentage || '',
      amountPaid: assoc.amountPaid || '',
      paymentGivenDate: assoc.paymentGivenDate ? assoc.paymentGivenDate.slice(0, 10) : '',
      paymentGivenBank: assoc.paymentGivenBank || ''
    });
    setShowAddAssociateModal(true);
  };

  const handleUpdateAssociate = async () => {
    if (!addAssocForm.associateId) { showError('Please select an associate'); return; }
    const pct = parseFloat(addAssocForm.percentage);
    if (!pct || pct <= 0 || pct > 100) { showError('Please enter a valid percentage (1–100)'); return; }
    setSavingAssociate(true);
    try {
      const updatedEntry = {
        ...project.projectAssociates[editAssocIndex],
        associateId: addAssocForm.associateId,
        percentage: pct,
        amountPaid: parseFloat(addAssocForm.amountPaid) || 0,
        paymentGivenDate: addAssocForm.paymentGivenDate || null,
        paymentGivenBank: addAssocForm.paymentGivenBank || ''
      };
      const updatedAssociates = project.projectAssociates.map((a, i) => i === editAssocIndex ? updatedEntry : a);
      await FinanceService.updateProject(project._id, { ...project, projectAssociates: updatedAssociates });
      setProject(prev => ({ ...prev, projectAssociates: updatedAssociates }));
      setShowAddAssociateModal(false);
      setEditAssocIndex(null);
      setAddAssocForm({ associateId: '', percentage: '', amountPaid: '', paymentGivenDate: '', paymentGivenBank: '' });
      showSuccess('Associate updated successfully');
      loadAllData();
    } catch (error) {
      console.error('Error updating associate:', error);
      showError('Failed to update associate: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingAssociate(false);
    }
  };

  const handleDeleteAssociate = async (index) => {
    const assocInfo = associates.find(a => a._id === project.projectAssociates[index]?.associateId);
    const name = assocInfo?.name || 'this associate';
    if (!window.confirm(`Remove ${name} from this project?`)) return;
    try {
      const updatedAssociates = project.projectAssociates.filter((_, i) => i !== index);
      await FinanceService.updateProject(project._id, { ...project, projectAssociates: updatedAssociates });
      setProject(prev => ({ ...prev, projectAssociates: updatedAssociates }));
      showSuccess('Associate removed successfully');
      loadAllData();
    } catch (error) {
      console.error('Error removing associate:', error);
      showError('Failed to remove associate: ' + (error.response?.data?.message || error.message));
    }
  };


  if (!project) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '20px' }}>
        {/* Skeleton header - gives browser an early LCP candidate */}
        <div style={{
          padding: '16px 20px',
          background: '#2c5282',
          borderRadius: '6px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '20px', fontWeight: 600 }}>
            {cachedProjectName || 'Loading project...'}
          </h3>
        </div>
        {/* Skeleton cards */}
        {[1, 2].map(i => (
          <div key={i} style={{
            background: 'white',
            borderRadius: '10px',
            padding: '24px',
            marginBottom: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ height: 16, width: '40%', background: '#e5e7eb', borderRadius: 4, marginBottom: 12 }} />
            <div style={{ height: 12, width: '80%', background: '#f3f4f6', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 12, width: '60%', background: '#f3f4f6', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

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
              onClick={() => navigate('/finance')}
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
              <FaArrowLeft /> Back to Finance
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #667eea', paddingBottom: '10px' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#1f2937'
            }}>
              Associate Information
            </h3>
            {canEditProject && (
              <button
                onClick={() => setShowAddAssociateModal(true)}
                style={{
                  padding: '6px 14px',
                  background: '#667eea',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <FaUsers style={{ fontSize: '12px' }} /> + Add Associate
              </button>
            )}
          </div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                        {associateInfo?.name || 'Unknown'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        {canEditProject && (
                          <>
                            <button
                              onClick={() => openEditAssociate(index)}
                              title="Edit associate"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667eea', padding: '2px 4px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteAssociate(index)}
                              title="Remove associate"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px 4px', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
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

          {/* Add / Edit Associate Modal */}
          {showAddAssociateModal && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div style={{
                background: 'white', borderRadius: '12px', padding: '28px',
                width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                  {editAssocIndex !== null ? 'Edit Associate' : 'Add Associate'}
                </h3>

                {/* Associate Select */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Associate *
                  </label>
                  <select
                    value={addAssocForm.associateId}
                    onChange={e => setAddAssocForm(f => ({ ...f, associateId: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  >
                    <option value="">-- Select Associate --</option>
                    {allAssociatesList.map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                {/* Percentage */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Percentage (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 25"
                    value={addAssocForm.percentage}
                    onChange={e => setAddAssocForm(f => ({ ...f, percentage: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Amount Paid */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={addAssocForm.amountPaid}
                    onChange={e => setAddAssocForm(f => ({ ...f, amountPaid: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Payment Date */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={addAssocForm.paymentGivenDate}
                    onChange={e => setAddAssocForm(f => ({ ...f, paymentGivenDate: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Paid via Bank */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Paid via Bank
                  </label>
                  <select
                    value={addAssocForm.paymentGivenBank}
                    onChange={e => setAddAssocForm(f => ({ ...f, paymentGivenBank: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  >
                    <option value="">-- Select Bank --</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                    <option value="Canara Bank">Canara Bank</option>
                    <option value="Union Bank of India">Union Bank of India</option>
                    <option value="IndusInd Bank">IndusInd Bank</option>
                    <option value="Yes Bank">Yes Bank</option>
                  </select>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowAddAssociateModal(false);
                      setEditAssocIndex(null);
                      setAddAssocForm({ associateId: '', percentage: '', amountPaid: '', paymentGivenDate: '', paymentGivenBank: '' });
                    }}
                    disabled={savingAssociate}
                    style={{
                      padding: '9px 20px', background: '#f3f4f6', border: '1px solid #d1d5db',
                      borderRadius: '6px', color: '#374151', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editAssocIndex !== null ? handleUpdateAssociate : handleSaveAssociate}
                    disabled={savingAssociate}
                    style={{
                      padding: '9px 20px', background: '#667eea', border: 'none',
                      borderRadius: '6px', color: 'white', cursor: savingAssociate ? 'not-allowed' : 'pointer',
                      fontSize: '14px', fontWeight: '600', opacity: savingAssociate ? 0.7 : 1
                    }}
                  >
                    {savingAssociate ? 'Saving...' : (editAssocIndex !== null ? 'Update Associate' : 'Add Associate')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Distribution Table */}
      <MemoizedYearlyDistributionTable 
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
        autoOpenAddPayment={autoOpenAddPayment}
      />

      {/* Associate Distribution Table */}
      <MemoizedAssociateDistributionTable 
        projectData={project}
        associates={associates}
      />
    </div>
    </div>
  );
};

export default ProjectDetailPage;
