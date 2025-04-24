import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import ChatList from './components/ChatList';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
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
      </AuthProvider>
    </Router>
  );
}

export default App;