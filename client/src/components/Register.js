import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Validate password and provide feedback
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      setPasswordFeedback('');
      return;
    }

    let strength = 0;
    let feedback = [];

    // Length check
    if (password.length >= 8) {
      strength += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('At least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('At least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      strength += 1;
    } else {
      feedback.push('At least one number');
    }

    setPasswordStrength(strength);
    setPasswordFeedback(feedback.join(', '));
  }, [password]);

  const isPasswordValid = () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    
    if (!isPasswordValid()) {
      setError('Password must be at least 8 characters long and include uppercase, lowercase, and numbers');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      const result = await register(email, password, name);
      
      // Navigate to the default chat if available, otherwise go to home
      if (result.defaultChat && result.defaultChat.id) {
        navigate(`/chat/${result.defaultChat.id}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get color based on password strength
  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
        return '#ff6b6b';
      case 1:
        return '#ff9f43';
      case 2:
        return '#feca57';
      case 3:
        return '#54a0ff';
      case 4:
        return '#26de81';
      default:
        return '#ff6b6b';
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

            <div style={{ marginBottom: '0.5rem' }}>
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
                  border: `1px solid ${password ? getStrengthColor() : '#404040'}`,
                  backgroundColor: '#2a2a2a',
                  color: '#e0e0e0'
                }}
              />
            </div>
            
            {/* Password strength indicator */}
            {password && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  marginBottom: '0.5rem' 
                }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div 
                      key={level}
                      style={{
                        height: '4px',
                        flex: 1,
                        backgroundColor: passwordStrength >= level 
                          ? getStrengthColor() 
                          : '#404040',
                        marginRight: level < 4 ? '4px' : 0,
                        borderRadius: '2px',
                        transition: 'background-color 0.3s'
                      }}
                    />
                  ))}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: getStrengthColor() 
                }}>
                  {passwordFeedback || (
                    passwordStrength === 4 
                      ? 'Strong password' 
                      : 'Password requirements met, but could be stronger'
                  )}
                </div>
              </div>
            )}

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
              disabled={loading || !isPasswordValid()}
              style={{
                width: '100%',
                padding: '0.8rem',
                backgroundColor: isPasswordValid() ? '#4299e1' : '#6c757d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: isPasswordValid() ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
                marginBottom: '1.5rem',
                opacity: isPasswordValid() ? 1 : 0.7
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