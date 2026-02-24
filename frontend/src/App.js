import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/theme.css';
import { CompanyProvider } from './CompanyContext';
import { AppModeProvider } from './contexts/AppModeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import DefaultRoute from './DefaultRoute';
import LoginPage from './LoginPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import Sidebar from './Sidebar';
import HomePage from './HomePage';
import ClientsPage from './ClientsPage';
import ClientProjectsPage from './ClientProjectsPage';
import AssociatesPage from './AssociatesPage';
import AssociateProjectsPage from './AssociateProjectsPage';
import SettingsPage from './SettingsPage';
import ProjectPage from './ProjectPage';
import UserManagementPage from './UserManagementPage';
import RoleManagementPage from './RoleManagementPage';
import AnalyticsDashboard from './AnalyticsDashboard';
import ExpenseDistribution from './ExpenseDistribution';

function App() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <Router>
      <AuthProvider>
        <LoadingProvider>
          <CompanyProvider>
            <AppModeProvider>
              <ToastProvider>
                <Routes>
                  {/* Public routes - Login and Password Reset */}
                  <Route path="/login" element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  } />
                  
                  <Route path="/forgot-password" element={
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  } />
                  
                  <Route path="/reset-password/:token" element={
                    <PublicRoute>
                      <ResetPasswordPage />
                    </PublicRoute>
                  } />
                  
                  {/* Protected routes with layout */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <div className="App">
                          <Sidebar 
                            isExpanded={isSidebarExpanded} 
                            toggleSidebar={toggleSidebar}
                          />
                          
                          <div className={`main-content ${isSidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
                          <Routes>
                            <Route path="/" element={<DefaultRoute />} />
                            
                            <Route 
                              path="/home" 
                              element={
                                <ProtectedRoute requireModule="home">
                                  <HomePage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/clients" 
                              element={
                                <ProtectedRoute requireModule="clients">
                                  <ClientsPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/clients/:clientId/projects" 
                              element={
                                <ProtectedRoute requireModule="clients">
                                  <ClientProjectsPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/associates" 
                              element={
                                <ProtectedRoute requireModule="associates">
                                  <AssociatesPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/associates/:associateId/projects" 
                              element={
                                <ProtectedRoute requireModule="associates">
                                  <AssociateProjectsPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/projects" 
                              element={
                                <ProtectedRoute requireModule="finance">
                                  <ProjectPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/analytics" 
                              element={
                                <ProtectedRoute requireModule="finance">
                                  <AnalyticsDashboard />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/expense-distribution" 
                              element={
                                <ProtectedRoute requireModule="finance">
                                  <ExpenseDistribution />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/settings" 
                              element={
                                <ProtectedRoute requireModule="settings">
                                  <SettingsPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/user-management" 
                              element={
                                <ProtectedRoute requireAdmin>
                                  <UserManagementPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route 
                              path="/role-management" 
                              element={
                                <ProtectedRoute requireAdmin>
                                  <RoleManagementPage />
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route path="*" element={<DefaultRoute />} />
                          </Routes>
                        </div>
                      </div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </ToastProvider>
          </AppModeProvider>
        </CompanyProvider>
      </LoadingProvider>
    </AuthProvider>
    </Router>
  );
}

export default App;