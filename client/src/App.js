import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import ChatList from './components/ChatList';
import PrivateRoute from './components/PrivateRoute';
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
        minWidth: '300px',
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
  return (
    <>
      <SessionNotification />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute>
            <div style={{ 
              display: 'flex',
              height: '100vh',
              backgroundColor: '#121212',
              color: '#e0e0e0' 
            }}>
              <ChatList />
              <div style={{ 
                marginLeft: '250px', 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <h2 style={{ 
                  color: '#68d5f8',
                  fontSize: '2rem',
                  marginBottom: '1.5rem'
                }}>
                  Welcome to MindBloom
                </h2>
                <p style={{ 
                  maxWidth: '500px', 
                  fontSize: '1.1rem', 
                  lineHeight: 1.6,
                  color: '#a0a0a0'
                }}>
                  Select a chat from the sidebar or start a new conversation to get help with your psychology questions.
                </p>
              </div>
            </div>
          </PrivateRoute>
        } />
        <Route path="/chat/:chatId" element={
          <PrivateRoute>
            <div style={{ display: 'flex' }}>
              <ChatList />
              <div style={{ flex: 1, marginLeft: '250px' }}>
                <Chat />
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