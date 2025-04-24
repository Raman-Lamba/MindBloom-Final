import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await register(email, password, name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
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
      position: 'relative',
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
        padding: '2rem'
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
            Register
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
                htmlFor="name" 
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                  color: '#a0a0a0'
                }}
              >
                Name (optional)
              </label>
              <input 
                type="text" 
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  backgroundColor: '#2a2a2a',
                  color: '#e0e0e0'
                }}
              />
            </div>

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
                  color: '#e0e0e0'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
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
                  color: '#e0e0e0'
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label 
                htmlFor="confirmPassword" 
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                  color: '#a0a0a0'
                }}
              >
                Confirm Password
              </label>
              <input 
                type="password" 
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} 
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  backgroundColor: '#2a2a2a',
                  color: '#e0e0e0'
                }}
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
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                marginBottom: '1.5rem'
              }}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>

            <div style={{ 
              textAlign: 'center', 
              color: '#a0a0a0',
              fontSize: '0.9rem' 
            }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#68d5f8',
                  textDecoration: 'none' 
                }}
              >
                Login here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 