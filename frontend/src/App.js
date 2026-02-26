import React, { useState, useEffect, Suspense, lazy } from 'react';
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

// Lazy load all route components for code splitting and faster initial load
const LoginPage = lazy(() => import('./LoginPage'));
const ForgotPasswordPage = lazy(() => import('./ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./ResetPasswordPage'));
const Sidebar = lazy(() => import('./Sidebar'));
const HomePage = lazy(() => import('./HomePage'));
const ClientsPage = lazy(() => import('./ClientsPage'));
const ClientProjectsPage = lazy(() => import('./ClientProjectsPage'));
const AssociatesPage = lazy(() => import('./AssociatesPage'));
const AssociateProjectsPage = lazy(() => import('./AssociateProjectsPage'));
const SettingsPage = lazy(() => import('./SettingsPage'));
const ProjectPage = lazy(() => import('./ProjectPage'));
const ProjectDetailPage = lazy(() => import('./ProjectDetailPage'));
const UserManagementPage = lazy(() => import('./UserManagementPage'));
const RoleManagementPage = lazy(() => import('./RoleManagementPage'));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));

function App() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // Hide the HTML loading screen the moment React mounts — no overlap with Suspense
  useEffect(() => {
    const el = document.getElementById('loading-screen');
    if (el) {
      el.classList.add('hidden');
      setTimeout(() => { el.style.display = 'none'; }, 300);
    }
  }, []);

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
                <Suspense fallback={null}>
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
                    
                    {/* Full-screen project detail page - No sidebar */}
                    <Route 
                      path="/projects/:projectId" 
                      element={
                        <ProtectedRoute requireModule="finance">
                          <ProjectDetailPage />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Full-screen client projects page - No sidebar */}
                    <Route
                      path="/clients/:clientId/projects"
                      element={
                        <ProtectedRoute requireModule="clients">
                          <ClientProjectsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Full-screen associate projects page - No sidebar */}
                    <Route
                      path="/associates/:associateId/projects"
                      element={
                        <ProtectedRoute requireModule="associates">
                          <AssociateProjectsPage />
                        </ProtectedRoute>
                      }
                    />
                    
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
                              path="/associates" 
                              element={
                                <ProtectedRoute requireModule="associates">
                                  <AssociatesPage />
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
            </Suspense>
            </ToastProvider>
          </AppModeProvider>
        </CompanyProvider>
      </LoadingProvider>
    </AuthProvider>
    </Router>
  );
}

export default App;