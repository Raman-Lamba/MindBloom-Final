import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FaSignOutAlt, FaUser, FaBars } from 'react-icons/fa';
import useResponsive from '../utils/useResponsive';

const Header = ({ toggleSidebar }) => {
  const { currentUser, logout } = useContext(AuthContext);
  const { isMobile } = useResponsive();

  return (
    <header style={{ 
      padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
      backgroundColor: '#1e1e1e',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isMobile && (
          <button
            onClick={toggleSidebar}
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
              minWidth: '28px', // Ensure good touch target
              minHeight: '28px'  // Ensure good touch target
            }}
            aria-label="Open Sidebar"
          >
            <FaBars size={20} />
          </button>
        )}
        <Link 
          to="/" 
          style={{ 
            color: '#68d5f8', 
            fontSize: isMobile ? '1.3rem' : '1.5rem',
            fontWeight: '600',
            textDecoration: 'none'
          }}
        >
          MindBloom
        </Link>
      </div>

      {currentUser && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          {!isMobile && (
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
          )}
          
          <button 
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'transparent',
              color: '#e0e0e0',
              border: '1px solid #404040',
              borderRadius: '8px',
              padding: isMobile ? '0.5rem' : '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s',
              minWidth: isMobile ? '36px' : 'auto', // Ensure good touch target
              minHeight: '36px' // Ensure good touch target
            }}
          >
            <FaSignOutAlt style={{ marginRight: isMobile ? '0' : '0.5rem' }} />
            {!isMobile && <span>Logout</span>}
          </button>
        </div>
      )}
    </header>
  );
};

export default Header; 