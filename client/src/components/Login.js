import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      const result = await login(email, password);
      
      // Navigate to the default chat if available, otherwise go to home
      if (result.defaultChat && result.defaultChat.id) {
        navigate(`/chat/${result.defaultChat.id}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (err.response?.status === 401) {
        setError('Invalid credentials. Please check your email and password.');
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#121212',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      color: '#e0e0e0'
    }}>
      <header style={{ 
        padding: '1.5rem',
        backgroundColor: '#1e1e1e',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#68d5f8',
        textAlign: 'center'
      }}>
        MindBloom
      </header>

      <div style={{ 
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#1e1e1e',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{
            textAlign: 'center',
            marginBottom: '2rem',
            color: '#68d5f8',
            fontSize: '1.8rem'
          }}>
            Login
          </h2>

          {error && (
            <div style={{
              backgroundColor: 'rgba(220, 53, 69, 0.2)',
              color: '#ff6b6b',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="email" 
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                  color: '#a0a0a0'
                }}
              >
                Email
              </label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  backgroundColor: '#2a2a2a',
                  color: '#e0e0e0',
                  boxSizing: 'border-box'
                }}
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label 
                htmlFor="password" 
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                  color: '#a0a0a0'
                }}
              >
                Password
              </label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  backgroundColor: '#2a2a2a',
                  color: '#e0e0e0',
                  boxSizing: 'border-box'
                }}
                autoComplete="current-password"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem',
                backgroundColor: '#4299e1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                marginBottom: '1.5rem',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div style={{ 
              textAlign: 'center', 
              color: '#a0a0a0',
              fontSize: '0.9rem' 
            }}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                style={{ 
                  color: '#68d5f8',
                  textDecoration: 'none' 
                }}
              >
                Register here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 