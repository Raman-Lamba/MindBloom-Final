import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import ChatList from './components/ChatList';
import PrivateRoute from './components/PrivateRoute';
import useResponsive from './utils/useResponsive';
import { FaBars } from 'react-icons/fa';
import './App.css';

// Session expiration notification component
const SessionNotification = () => {
  const { error, clearError } = useContext(AuthContext);
  
  if (!error || !error.includes('session')) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(220, 53, 69, 0.9)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 'calc(100% - 40px)',
        maxWidth: '500px'
      }}
    >
      <span>{error}</span>
      <button 
        onClick={clearError}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          marginLeft: '16px',
          cursor: 'pointer',
          fontSize: '18px'
        }}
      >
        ×
      </button>
    </div>
  );
};

const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile } = useResponsive();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleClickOutside = (event) => {
      // Check if click is outside sidebar and sidebar is open
      if (sidebarOpen && !event.target.closest('.sidebar') && 
          !event.target.closest('.sidebar-toggle')) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [sidebarOpen, isMobile]);

  // Add overlay when sidebar is open on mobile
  const Overlay = () => {
    if (!isMobile || !sidebarOpen) return null;
    
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 999
        }}
        onClick={toggleSidebar}
      />
    );
  };

  return (
    <>
      <SessionNotification />
      <Overlay />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute>
            <div style={{ 
              display: 'flex',
              height: '100vh',
              backgroundColor: '#121212',
              color: '#e0e0e0',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <ChatList isOpen={sidebarOpen} toggleSidebar={toggleSidebar} className="sidebar" />
              <div style={{ 
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div style={{ width: '100%' }}>
                  {/* Header with toggle */}
                  <header style={{ 
                    padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
                    backgroundColor: '#1e1e1e',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {isMobile && (
                        <button
                          onClick={toggleSidebar}
                          className="sidebar-toggle"
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#a0a0a0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '15px',
                            padding: '5px',
                            minWidth: '28px',
                            minHeight: '28px'
                          }}
                          aria-label="Open Sidebar"
                        >
                          <FaBars size={20} />
                        </button>
                      )}
                      <span style={{ 
                        color: '#68d5f8', 
                        fontSize: isMobile ? '1.3rem' : '1.5rem',
                        fontWeight: '600'
                      }}>
                        MindBloom
                      </span>
                    </div>
                  </header>
                </div>
                
                <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <h2 style={{ 
                    color: '#68d5f8',
                    fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                    marginBottom: '1.5rem'
                  }}>
                    Welcome to MindBloom
                  </h2>
                  <p style={{ 
                    width: 'calc(100% - 40px)',
                    maxWidth: '500px', 
                    fontSize: 'clamp(1rem, 3vw, 1.1rem)', 
                    lineHeight: 1.6,
                    color: '#a0a0a0',
                    padding: '0 20px',
                    textAlign: 'center'
                  }}>
                    Select a chat from the sidebar or start a new conversation to get help with your psychology questions.
                  </p>
                </div>
              </div>
            </div>
          </PrivateRoute>
        } />
        <Route path="/chat/:chatId" element={
          <PrivateRoute>
            <div style={{ display: 'flex', position: 'relative', overflow: 'hidden', height: '100vh' }}>
              <ChatList isOpen={sidebarOpen} toggleSidebar={toggleSidebar} className="sidebar" />
              <div style={{ 
                width: '100%',
                height: '100%'
              }}>
                <Chat toggleSidebar={toggleSidebar} />
              </div>
            </div>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;