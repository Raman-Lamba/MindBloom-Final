import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';

const Header = () => {
  const { currentUser, logout } = useContext(AuthContext);

  return (
    <header style={{ 
      padding: '1rem 1.5rem',
      backgroundColor: '#1e1e1e',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Link 
        to="/" 
        style={{ 
          color: '#68d5f8', 
          fontSize: '1.5rem',
          fontWeight: '600',
          textDecoration: 'none'
        }}
      >
        MindBloom
      </Link>

      {currentUser && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: '1.5rem',
            color: '#a0a0a0',
            fontSize: '0.9rem'
          }}>
            <FaUser style={{ marginRight: '0.5rem' }} />
            <span>{currentUser.name || currentUser.email}</span>
          </div>
          
          <button 
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'transparent',
              color: '#e0e0e0',
              border: '1px solid #404040',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            <FaSignOutAlt style={{ marginRight: '0.5rem' }} />
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header; 