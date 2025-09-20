import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import db from '../database';

const OrdersList = () => {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load orders and users
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await db.orders.orderBy('createdAt').reverse().toArray();
      const allUsers = await db.users.toArray();
      
      const usersMap = {};
      allUsers.forEach(user => {
        usersMap[user.id] = user;
      });
      
      setOrders(allOrders);
      setUsers(usersMap);
    } catch (error) {
      console.error('Error loading orders:', error);
      setMessage({ type: 'error', text: t('errorLoadingOrders') });
    } finally {
      setLoading(false);
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(t('confirmDeleteOrder'))) {
      try {
        await db.orders.delete(orderId);
        setMessage({ type: 'success', text: t('orderDeletedSuccessfully') });
        loadOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
        setMessage({ type: 'error', text: t('errorDeletingOrder') });
      }
    }
  };

  // Export to JSON
  const handleExportToJSON = async () => {
    try {
      const allOrders = await db.orders.toArray();
      const allUsers = await db.users.toArray();
      
      const exportData = {
        orders: allOrders,
        users: allUsers,
        exportDate: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `eslam-aluminum-orders-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      setMessage({ type: 'success', text: t('dataExportedSuccessfully') });
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage({ type: 'error', text: t('errorExportingData') });
    }
  };

  // Import from JSON
  const handleImportFromJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.users && data.orders) {
          // Clear existing data
          await db.users.clear();
          await db.orders.clear();
          
          // Import new data
          await db.users.bulkAdd(data.users);
          await db.orders.bulkAdd(data.orders);
          
          setMessage({ type: 'success', text: t('dataImportedSuccessfully') });
          loadOrders();
        } else {
          setMessage({ type: 'error', text: t('invalidFile') });
        }
      } catch (error) {
        console.error('Error importing data:', error);
        setMessage({ type: 'error', text: t('errorImportingData') });
      }
    };
    reader.readAsText(file);
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    const user = users[order.userId];
    if (!user) return false;
    
    return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           order.totalAmount.toString().includes(searchTerm) ||
           order.items.some(item => 
             item.category.toLowerCase().includes(searchTerm.toLowerCase())
           );
  });

  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">{t('allOrders')}</h1>
        </div>

        {message && (
          <div className={message.type === 'error' ? 'error' : 'success'}>
            {message.text}
          </div>
        )}

        {/* Search and Export Controls */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '200px' }}>
            <input
              type="text"
              placeholder={t('searchOrders')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ margin: 0 }}
            />
          </div>
          
          <button
            className="btn btn-success"
            onClick={handleExportToJSON}
          >
            {t('exportToJSON')}
          </button>
          
          <label className="btn btn-warning" style={{ margin: 0, cursor: 'pointer' }}>
            {t('importFromJSON')}
            <input
              type="file"
              accept=".json"
              onChange={handleImportFromJSON}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            {searchTerm ? t('noOrdersFound') : t('noOrdersYet')}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('customer')}</th>
                  <th>{t('numberOfItems')}</th>
                  <th>{t('totalAmount')}</th>
                  <th>{t('creationDate')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const user = users[order.userId];
                  return (
                    <tr key={order.id}>
                      <td>{user ? user.name : t('other')}</td>
                      <td>{order.items.length}</td>
                      <td>{order.totalAmount.toFixed(2)} {t('currency')}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/order/${order.id}`}
                            className="btn btn-primary"
                          >
                            {t('view')}
                          </Link>
                          <Link
                            to={`/update-order/${order.id}`}
                            className="btn btn-warning"
                          >
                            {t('update')}
                          </Link>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteOrder(order.id)}
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {filteredOrders.length > 0 && (
          <div className="card" style={{ marginTop: '20px', backgroundColor: '#f8f9fa' }}>
            <h3>{t('ordersSummary')}</h3>
            <p>{t('totalOrders')}: {filteredOrders.length}</p>
            <p>{t('totalAmount2')}: {filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)} {t('currency')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersList;
