import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import db from '../database';

const Statistics = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    ordersCount: 0,
    usersCount: 0,
    totalAmount: 0,
    averageOrderValue: 0,
    storageUsed: 0,
    storageAvailable: 0,
    storagePercentage: 0,
    estimatedSize: 0,
    ordersByCategory: {},
    ordersByMonth: {},
    topCustomers: []
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // Get basic counts
      const ordersCount = await db.orders.count();
      const usersCount = await db.users.count();
      
      // Get all orders for calculations
      const orders = await db.orders.toArray();
      const users = await db.users.toArray();
      
      // Calculate total amount
      const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const averageOrderValue = ordersCount > 0 ? totalAmount / ordersCount : 0;
      
      // Calculate storage usage
      const ordersSize = JSON.stringify(orders).length;
      const usersSize = JSON.stringify(users).length;
      const estimatedSize = ordersSize + usersSize;
      
      // Check browser storage quota
      let storageUsed = 0;
      let storageAvailable = 0;
      let storagePercentage = 0;
      
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        storageUsed = estimate.usage || 0;
        storageAvailable = estimate.quota || 0;
        storagePercentage = storageAvailable > 0 ? (storageUsed / storageAvailable) * 100 : 0;
      }
      
      // Analyze orders by category
      const ordersByCategory = {};
      orders.forEach(order => {
        order.items.forEach(item => {
          const category = item.category || t('uncategorized');
          ordersByCategory[category] = (ordersByCategory[category] || 0) + 1;
        });
      });
      
      // Analyze orders by month
      const ordersByMonth = {};
      orders.forEach(order => {
        const month = new Date(order.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
        ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;
      });
      
      // Get top customers
      const customerTotals = {};
      orders.forEach(order => {
        const user = users.find(u => u.id === order.userId);
        const customerName = user ? user.name : `Unknown User (ID: ${order.userId})`;
        customerTotals[customerName] = (customerTotals[customerName] || 0) + order.totalAmount;
      });
      
      const topCustomers = Object.entries(customerTotals)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
      
      setStats({
        ordersCount,
        usersCount,
        totalAmount,
        averageOrderValue,
        storageUsed,
        storageAvailable,
        storagePercentage,
        estimatedSize,
        ordersByCategory,
        ordersByMonth,
        topCustomers
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount) => {
    return amount.toFixed(2) + ' ' + t('currency');
  };

  const getStorageColor = (percentage) => {
    if (percentage < 50) return '#28a745';
    if (percentage < 80) return '#ffc107';
    return '#dc3545';
  };

  const getBrowserLimit = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return t('chromeLimit');
    if (userAgent.includes('Firefox')) return t('firefoxLimit');
    if (userAgent.includes('Safari')) return t('safariLimit');
    if (userAgent.includes('Edge')) return t('edgeLimit');
    return t('variesByBrowser');
  };

  return (
    <div className="statistics-page">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">{t('statistics')}</h1>
          <button 
            className="btn btn-secondary" 
            onClick={loadStatistics}
          >
            {t('refresh')}
          </button>
        </div>

        {/* Basic Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.ordersCount}</h3>
              <p>{t('totalOrders')}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{stats.usersCount}</h3>
              <p>{t('totalCustomers')}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalAmount)}</h3>
              <p>{t('totalRevenue')}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.averageOrderValue)}</h3>
              <p>{t('averageOrderValue')}</p>
            </div>
          </div>
        </div>

        {/* Storage Information */}
        <div className="storage-section">
          <h2>{t('storageInformation')}</h2>
          <div className="storage-stats">
            <div className="stat-row">
              <span className="stat-label">{t('estimatedDataSize')}:</span>
              <span className="stat-value">{formatBytes(stats.estimatedSize)}</span>
            </div>
            
            {stats.storageAvailable > 0 && (
              <>
                <div className="stat-row">
                  <span className="stat-label">{t('browserStorageUsed')}:</span>
                  <span className="stat-value">{formatBytes(stats.storageUsed)}</span>
                </div>
                
                <div className="stat-row">
                  <span className="stat-label">{t('browserStorageAvailable')}:</span>
                  <span className="stat-value">{formatBytes(stats.storageAvailable)}</span>
                </div>
                
                <div className="stat-row">
                  <span className="stat-label">{t('usagePercentage')}:</span>
                  <span 
                    className="stat-value" 
                    style={{ color: getStorageColor(stats.storagePercentage) }}
                  >
                    {stats.storagePercentage.toFixed(1)}%
                  </span>
                </div>
                
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min(stats.storagePercentage, 100)}%`,
                        backgroundColor: getStorageColor(stats.storagePercentage)
                      }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="storage-info">
            <h4>{t('storageDetails')}</h4>
            <ul>
              <li><strong>{t('storageLocation')}:</strong> {t('browserIndexedDB')}</li>
              <li><strong>{t('browserLimit')}:</strong> {getBrowserLimit()}</li>
              <li><strong>{t('dataPersistence')}:</strong> {t('localToEachDevice')}</li>
              <li><strong>{t('backupMethod')}:</strong> {t('useExportImportFeature')}</li>
            </ul>
          </div>
        </div>

        {/* Orders by Category */}
        <div className="category-section">
          <h2>{t('ordersByCategory')}</h2>
          <div className="category-stats">
            {Object.entries(stats.ordersByCategory).map(([category, count]) => (
              <div key={category} className="category-item">
                <span className="category-name">{category}</span>
                <span className="category-count">{count} {t('orders')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by Month */}
        <div className="monthly-section">
          <h2>{t('ordersByMonth')}</h2>
          <div className="monthly-stats">
            {Object.entries(stats.ordersByMonth).map(([month, count]) => (
              <div key={month} className="month-item">
                <span className="month-name">{month}</span>
                <span className="month-count">{count} {t('orders')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="customers-section">
          <h2>{t('topCustomers')}</h2>
          <div className="customers-stats">
            {stats.topCustomers.map((customer, index) => (
              <div key={customer.name} className="customer-item">
                <span className="customer-rank">#{index + 1}</span>
                <span className="customer-name">{customer.name}</span>
                <span className="customer-total">{formatCurrency(customer.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Warning */}
        <div className="storage-warning">
          <h4>{t('importantNotes')}</h4>
          <ul>
            <li>{t('dataStoredLocally')}</li>
            <li>{t('clearingBrowserDataWarning')}</li>
            <li>{t('dataDoesNotSync')}</li>
            <li>{t('regularExportsRecommended')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
