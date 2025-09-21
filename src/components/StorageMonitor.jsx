import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import db from '../database';

const StorageMonitor = () => {
  const { t } = useLanguage();
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    available: 0,
    percentage: 0,
    ordersCount: 0,
    usersCount: 0,
    estimatedSize: 0
  });

  useEffect(() => {
    checkStorageUsage();
  }, []);

  const checkStorageUsage = async () => {
    try {
      // Get orders and users count
      const ordersCount = await db.orders.count();
      const usersCount = await db.users.count();
      
      // Estimate data size (rough calculation)
      const orders = await db.orders.toArray();
      const users = await db.users.toArray();
      
      const ordersSize = JSON.stringify(orders).length;
      const usersSize = JSON.stringify(users).length;
      const totalSize = ordersSize + usersSize;
      
      // Check browser storage quota
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const available = estimate.quota || 0;
        const percentage = available > 0 ? (used / available) * 100 : 0;
        
        setStorageInfo({
          used: used,
          available: available,
          percentage: percentage,
          ordersCount: ordersCount,
          usersCount: usersCount,
          estimatedSize: totalSize
        });
      } else {
        // Fallback estimation
        setStorageInfo({
          used: totalSize,
          available: 0,
          percentage: 0,
          ordersCount: ordersCount,
          usersCount: usersCount,
          estimatedSize: totalSize
        });
      }
    } catch (error) {
      console.error('Error checking storage:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStorageColor = (percentage) => {
    if (percentage < 50) return '#28a745'; // Green
    if (percentage < 80) return '#ffc107'; // Yellow
    return '#dc3545'; // Red
  };

  const getBrowserLimit = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return '~80% of available disk space';
    if (userAgent.includes('Firefox')) return '~50% of available disk space';
    if (userAgent.includes('Safari')) return '~1GB (iOS) / ~5GB (macOS)';
    if (userAgent.includes('Edge')) return '~80% of available disk space';
    return 'Varies by browser';
  };

  return (
    <div className="storage-monitor">
      <div className="card">
        <div className="card-header">
          <h3>Storage Usage Monitor</h3>
          <button 
            className="btn btn-secondary" 
            onClick={checkStorageUsage}
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            Refresh
          </button>
        </div>
        
        <div className="storage-stats">
          <div className="stat-row">
            <span className="stat-label">Orders Count:</span>
            <span className="stat-value">{storageInfo.ordersCount}</span>
          </div>
          
          <div className="stat-row">
            <span className="stat-label">Users Count:</span>
            <span className="stat-value">{storageInfo.usersCount}</span>
          </div>
          
          <div className="stat-row">
            <span className="stat-label">Estimated Data Size:</span>
            <span className="stat-value">{formatBytes(storageInfo.estimatedSize)}</span>
          </div>
          
          {storageInfo.available > 0 && (
            <>
              <div className="stat-row">
                <span className="stat-label">Browser Storage Used:</span>
                <span className="stat-value">{formatBytes(storageInfo.used)}</span>
              </div>
              
              <div className="stat-row">
                <span className="stat-label">Browser Storage Available:</span>
                <span className="stat-value">{formatBytes(storageInfo.available)}</span>
              </div>
              
              <div className="stat-row">
                <span className="stat-label">Usage Percentage:</span>
                <span 
                  className="stat-value" 
                  style={{ color: getStorageColor(storageInfo.percentage) }}
                >
                  {storageInfo.percentage.toFixed(1)}%
                </span>
              </div>
              
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min(storageInfo.percentage, 100)}%`,
                      backgroundColor: getStorageColor(storageInfo.percentage)
                    }}
                  ></div>
                </div>
              </div>
            </>
          )}
          
          <div className="storage-info">
            <h4>Storage Information:</h4>
            <ul>
              <li><strong>Storage Location:</strong> Browser (IndexedDB)</li>
              <li><strong>Browser Limit:</strong> {getBrowserLimit()}</li>
              <li><strong>Data Persistence:</strong> Local to each device</li>
              <li><strong>Backup:</strong> Use Export/Import feature</li>
            </ul>
          </div>
          
          <div className="storage-warning">
            <h4>Important Notes:</h4>
            <ul>
              <li>Data is stored locally in your browser only</li>
              <li>Clearing browser data will delete all orders</li>
              <li>Data doesn't sync between devices</li>
              <li>Regular exports are recommended for backup</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageMonitor;
