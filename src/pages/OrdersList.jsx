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
  const [expandedOrders, setExpandedOrders] = useState(new Set());
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

  // Toggle order expansion
  const toggleOrderExpansion = (orderId) => {
    const newExpandedOrders = new Set(expandedOrders);
    if (newExpandedOrders.has(orderId)) {
      newExpandedOrders.delete(orderId);
    } else {
      newExpandedOrders.add(orderId);
    }
    setExpandedOrders(newExpandedOrders);
  };

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
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
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
            onClick={handleExportToJSON}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              border: '1px solid #10b981',
              borderRadius: '8px',
              color: '#10b981',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#10b981';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {t('exportToJSON')}
          </button>
          
          <label 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              color: '#f59e0b',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              margin: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f59e0b';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#f59e0b';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17,8 12,3 7,8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
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
                  <th style={{ width: '40px' }}></th>
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
                  const isExpanded = expandedOrders.has(order.id);
                  
                  return (
                    <React.Fragment key={order.id}>
                      {/* Main Order Row */}
                      <tr>
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <button
                            onClick={() => toggleOrderExpansion(order.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.3s ease',
                              backgroundColor: '#007bff',
                              width: '32px',
                              height: '32px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#0056b3';
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#007bff';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="white" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              style={{
                                transition: 'transform 0.3s ease',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                              }}
                            >
                              <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                          </button>
                        </td>
                        <td>{user ? user.name : `Unknown User (ID: ${order.userId})`}</td>
                        <td>{order.items.length}</td>
                        <td>{order.totalAmount.toFixed(2)} {t('currency')}</td>
                        <td>
                          <div style={{ 
                            textAlign: language === 'ar' ? 'right' : 'left',
                            direction: language === 'ar' ? 'rtl' : 'ltr'
                          }}>
                            {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Link
                              to={`/order/${order.id}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                border: '1px solid #007bff',
                                borderRadius: '6px',
                                color: '#007bff',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                backgroundColor: 'transparent',
                                minWidth: '80px',
                                width: '80px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#007bff';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#007bff';
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                              {t('view')}
                            </Link>
                            
                            <Link
                              to={`/update-order/${order.id}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                border: '1px solid #f59e0b',
                                borderRadius: '6px',
                                color: '#f59e0b',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                backgroundColor: 'transparent',
                                minWidth: '80px',
                                width: '80px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f59e0b';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#f59e0b';
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                              {t('update')}
                            </Link>
                            
                            <button
                              onClick={() => showDeleteModal(order.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                border: '1px solid #ef4444',
                                borderRadius: '6px',
                                color: '#ef4444',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                minWidth: '80px',
                                width: '80px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#ef4444';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#ef4444';
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                              {t('delete')}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Items Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="6" style={{ padding: '0', backgroundColor: '#f8f9fa' }}>
                            <div 
                              style={{
                                padding: '20px',
                                borderTop: '1px solid #e5e7eb',
                                animation: 'slideDown 0.3s ease'
                              }}
                            >
                              <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '16px', fontWeight: '600' }}>
                                {t('orderItems')} ({order.items.length})
                              </h4>
                              
                              <div className="table-responsive">
                                <table className="table" style={{ marginBottom: '0', fontSize: '14px' }}>
                                  <thead>
                                    <tr style={{ backgroundColor: '#e5e7eb' }}>
                                      <th style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('description')}</th>
                                      <th style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('width')}</th>
                                      <th style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('length')}</th>
                                      <th style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('area')}</th>
                                      <th style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('quantity')}</th>
                                      <th style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('category')}</th>
                                      <th style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('pricePerMeter')}</th>
                                      <th style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('total')}</th>
                                      <th style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('status')}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items.map((item, index) => (
                                      <tr key={index} style={{ backgroundColor: '#fff' }}>
                                        <td style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left', wordWrap: 'break-word', maxWidth: '200px' }}>
                                          {item.description || '-'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                                          {item.width} {t('meter')}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                                          {item.length} {t('meter')}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                                          {item.area.toFixed(2)} {t('squareMeter')}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                                          {item.quantity}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                                          {item.category || '-'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                                          {item.pricePerMeter.toFixed(2)} {t('currency')}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left', fontWeight: 'bold', color: '#059669' }}>
                                          {item.total.toFixed(2)} {t('currency')}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                                          <span 
                                            style={{
                                              padding: '4px 8px',
                                              borderRadius: '12px',
                                              fontSize: '12px',
                                              fontWeight: '500',
                                              backgroundColor: item.status === 'done' ? '#dcfce7' : '#fef3c7',
                                              color: item.status === 'done' ? '#166534' : '#92400e'
                                            }}
                                          >
                                            {t(item.status)}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* Order Summary with Advance Payment */}
                              <div style={{ 
                                marginTop: '20px', 
                                padding: '15px', 
                                backgroundColor: '#f8f9fa', 
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                              }}>
                                <div style={{ marginBottom: '10px' }}>
                                  <h4 style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '16px' }}>
                                    {t('grandTotal2')}: <strong>{order.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)} {t('currency')}</strong>
                                  </h4>
                                </div>
                                
                                {order.address && (
                                  <div style={{ marginBottom: '10px' }}>
                                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                      <strong>{t('address')}:</strong> {order.address}
                                    </p>
                                  </div>
                                )}
                                
                                {(() => {
                                  // Handle both old and new format
                                  const payments = order.advancePayments && Array.isArray(order.advancePayments) 
                                    ? order.advancePayments 
                                    : [
                                        ...(order.firstAdvancePayment && parseFloat(order.firstAdvancePayment) > 0 ? [{
                                          amount: order.firstAdvancePayment,
                                          date: order.firstAdvanceDate
                                        }] : []),
                                        ...(order.secondAdvancePayment && parseFloat(order.secondAdvancePayment) > 0 ? [{
                                          amount: order.secondAdvancePayment,
                                          date: order.secondAdvanceDate
                                        }] : [])
                                      ];
                                  
                                  const hasValidPayments = payments.some(p => p.amount && !isNaN(parseFloat(p.amount)) && parseFloat(p.amount) > 0);
                                  
                                  if (!hasValidPayments) return null;
                                  
                                  const getPaymentNumberText = (index) => {
                                    const numbers = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
                                    return numbers[index] || `${index + 1}th`;
                                  };
                                  
                                  return (
                                    <>
                                      {payments.map((payment, index) => (
                                        payment.amount && !isNaN(parseFloat(payment.amount)) && parseFloat(payment.amount) > 0 && (
                                          <div key={index} style={{ marginBottom: '8px' }}>
                                            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                              {t(`${getPaymentNumberText(index)}AdvancePayment`)}: <strong>-{parseFloat(payment.amount).toFixed(2)} {t('currency')}</strong>
                                              {payment.date && <span style={{ fontSize: '0.9em', marginLeft: '10px' }}>({payment.date})</span>}
                                            </p>
                                          </div>
                                        )
                                      ))}
                                      
                                      <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                                        <h4 style={{ margin: '0', color: '#007bff', fontSize: '16px', fontWeight: 'bold' }}>
                                          {t('residualAmount')}: <strong>{(order.remainingAmount || order.items.reduce((sum, item) => sum + item.total, 0) - payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)).toFixed(2)} {t('currency')}</strong>
                                        </h4>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
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
