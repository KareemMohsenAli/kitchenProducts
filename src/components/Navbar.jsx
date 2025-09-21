import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Navbar = () => {
  const location = useLocation();
  const { t, language, toggleLanguage } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          {t('companyName')}
        </Link>
        
        {/* Mobile menu button */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Desktop navigation */}
        <div className="desktop-nav">
          <ul className="navbar-nav">
            <li>
              <Link 
                to="/" 
                className={location.pathname === '/' || location.pathname === '/orders' ? 'active' : ''}
              >
                {t('viewOrders')}
              </Link>
            </li>
            <li>
              <Link 
                to="/create" 
                className={location.pathname === '/create' ? 'active' : ''}
              >
                {t('createOrder')}
              </Link>
            </li>
            <li>
              <Link 
                to="/statistics" 
                className={location.pathname === '/statistics' ? 'active' : ''}
              >
                {t('statistics')}
              </Link>
            </li>
            <li>
              <Link 
                to="/users" 
                className={location.pathname === '/users' ? 'active' : ''}
              >
                {t('manageUsers')}
              </Link>
            </li>
          </ul>
          <button 
            className="language-toggle" 
            onClick={toggleLanguage}
          >
            {language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        {/* Mobile navigation */}
        <div className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`}>
          <ul className="navbar-nav">
            <li>
              <Link 
                to="/" 
                className={location.pathname === '/' || location.pathname === '/orders' ? 'active' : ''}
                onClick={closeMobileMenu}
              >
                {t('viewOrders')}
              </Link>
            </li>
            <li>
              <Link 
                to="/create" 
                className={location.pathname === '/create' ? 'active' : ''}
                onClick={closeMobileMenu}
              >
                {t('createOrder')}
              </Link>
            </li>
            <li>
              <Link 
                to="/statistics" 
                className={location.pathname === '/statistics' ? 'active' : ''}
                onClick={closeMobileMenu}
              >
                {t('statistics')}
              </Link>
            </li>
            <li>
              <Link 
                to="/users" 
                className={location.pathname === '/users' ? 'active' : ''}
                onClick={closeMobileMenu}
              >
                {t('manageUsers')}
              </Link>
            </li>
          </ul>
          <button 
            className="language-toggle" 
            onClick={toggleLanguage}
          >
            {language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
