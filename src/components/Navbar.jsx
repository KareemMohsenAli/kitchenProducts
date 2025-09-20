import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Navbar = () => {
  const location = useLocation();
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          {t('companyName')}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <ul className="navbar-nav">
            <li>
              <Link 
                to="/" 
                className={location.pathname === '/' ? 'active' : ''}
              >
                {t('createOrder')}
              </Link>
            </li>
            <li>
              <Link 
                to="/orders" 
                className={location.pathname === '/orders' ? 'active' : ''}
              >
                {t('viewOrders')}
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
