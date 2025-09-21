import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import db from '../database';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const OrdersList = () => {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    orderId: null,
    orderInfo: null,
    isLoading: false
  });

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
      toast.error(t('errorLoadingOrders'));
    } finally {
      setLoading(false);
    }
  };

  // Show delete confirmation modal
  const showDeleteModal = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    const user = users[order?.userId];
    
    setDeleteModal({
      isOpen: true,
      orderId,
      orderInfo: order ? {
        customerName: user ? user.name : `Unknown User (ID: ${order.userId})`,
        totalAmount: order.totalAmount.toFixed(2),
        creationDate: new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')
      } : null,
      isLoading: false
    });
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      orderId: null,
      orderInfo: null,
      isLoading: false
    });
  };

  // Confirm delete order
  const confirmDeleteOrder = async () => {
    if (!deleteModal.orderId) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      await db.orders.delete(deleteModal.orderId);
      toast.success(t('orderDeletedSuccessfully'));
      loadOrders();
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(t('errorDeletingOrder'));
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
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
      
      toast.success(t('dataExportedSuccessfully'));
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(t('errorExportingData'));
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
          
          toast.success(t('dataImportedSuccessfully'));
          loadOrders();
        } else {
          toast.error(t('invalidFile'));
        }
      } catch (error) {
        console.error('Error importing data:', error);
        toast.error(t('errorImportingData'));
      }
    };
    reader.readAsText(file);
  };


  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    const user = users[order.userId];
    
    // If no user found, show the order with a fallback name
    const userName = user ? user.name : `Unknown User (ID: ${order.userId})`;
    
    return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                      <td>{user ? user.name : `Unknown User (ID: ${order.userId})`}</td>
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
                            onClick={() => showDeleteModal(order.id)}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteOrder}
        orderInfo={deleteModal.orderInfo}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
};

export default OrdersList;
