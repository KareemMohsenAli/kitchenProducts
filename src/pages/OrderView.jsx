import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import db from '../database';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import InvoiceSelectionModal from '../components/InvoiceSelectionModal';

const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    isLoading: false
  });
  const [invoiceModal, setInvoiceModal] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await db.orders.get(parseInt(id));
      
      if (!orderData) {
        setMessage({ type: 'error', text: t('orderNotFound2') });
        return;
      }

      const userData = await db.users.get(orderData.userId);
      
      setOrder(orderData);
      setUser(userData);
      
      // Initialize all items as selected by default
      const allItemIndices = new Set(orderData.items.map((_, index) => index));
      setSelectedItems(allItemIndices);
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error(t('errorLoadingOrder'));
    } finally {
      setLoading(false);
    }
  };

  // Toggle item status
  const toggleItemStatus = async (itemIndex) => {
    if (!order) return;
    
    try {
      const updatedItems = [...order.items];
      updatedItems[itemIndex].status = updatedItems[itemIndex].status === 'working' ? 'done' : 'working';
      
      await db.orders.update(parseInt(id), {
        items: updatedItems,
        updatedAt: new Date()
      });
      
      setOrder({ ...order, items: updatedItems });
      toast.success(t('orderUpdatedSuccessfully'));
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error(t('errorUpdatingOrder'));
    }
  };

  // Toggle item selection
  const toggleItemSelection = (itemIndex) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(itemIndex)) {
      newSelectedItems.delete(itemIndex);
    } else {
      newSelectedItems.add(itemIndex);
    }
    setSelectedItems(newSelectedItems);
  };

  // Select all items
  const selectAllItems = () => {
    const allItemIndices = new Set(order.items.map((_, index) => index));
    setSelectedItems(allItemIndices);
  };

  // Deselect all items
  const deselectAllItems = () => {
    setSelectedItems(new Set());
  };

  // Handle status change from invoice modal
  const handleStatusChange = async (itemIndex) => {
    if (!order) return;
    
    try {
      const updatedItems = [...order.items];
      updatedItems[itemIndex].status = updatedItems[itemIndex].status === 'working' ? 'done' : 'working';
      
      await db.orders.update(parseInt(id), {
        items: updatedItems,
        updatedAt: new Date()
      });
      
      setOrder({ ...order, items: updatedItems });
      toast.success(t('orderUpdatedSuccessfully'));
    } catch (error) {
      console.error('Error updating item status:', error);
      toast.error(t('errorUpdatingOrder'));
    }
  };

  const generatePDF = async () => {
    if (selectedItems.size === 0) {
      toast.error(t('selectItemsForInvoice'));
      return;
    }

    try {
      const element = document.getElementById('invoice-content');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const selectedCount = selectedItems.size;
      const totalCount = order.items.length;
      const filename = selectedCount === totalCount 
        ? `eslam-order-${user?.name}-${language}-${new Date().toISOString().split('T')[0]}.pdf`
        : `eslam-order-${user?.name}-selected-${selectedCount}-${language}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      pdf.save(filename);
      toast.success(t('invoiceGeneratedSuccessfully'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('errorGeneratingInvoice'));
    }
  };

  const showDeleteModal = () => {
    setDeleteModal({
      isOpen: true,
      isLoading: false
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      isLoading: false
    });
  };

  const confirmDeleteOrder = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      await db.orders.delete(parseInt(id));
      toast.success(t('orderDeletedSuccessfully'));
      navigate('/');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(t('errorDeletingOrder'));
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  if (!order || !user) {
    return (
      <div className="error">
        {t('orderNotFound2')}
        <button className="btn btn-primary" onClick={() => navigate('/orders')} style={{ marginRight: '10px' }}>
          {t('backToOrders2')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">{t('orderDetails2')}</h1>
          <div className="action-buttons">
            <button className="btn btn-success" onClick={() => setInvoiceModal(true)}>
              {t('generatePDFInvoice')}
            </button>
            <button className="btn btn-danger" onClick={showDeleteModal}>
              {t('deleteOrder')}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              {t('backToOrders')}
            </button>
          </div>
        </div>


        {/* Invoice Content for PDF */}
        <div 
          id="invoice-content" 
          style={{ 
            backgroundColor: 'white', 
            padding: '20px',
            direction: language === 'ar' ? 'rtl' : 'ltr',
            textAlign: language === 'ar' ? 'right' : 'left'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#007bff', marginBottom: '10px' }}>{t('companyName')}</h1>
            <h2>{t('invoice')}</h2>
            <p>{t('orderDate')}: {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3>{t('customerData')}</h3>
            <p><strong>{t('name')}:</strong> {user.name}</p>
            <p><strong>{t('orderNumber')}:</strong> #{order.id}</p>
            <p><strong>{t('creationDate2')}:</strong> {new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3>{t('orderDetails3')}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('width')}</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('length')}</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('area')}</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('quantity')}</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('category')}</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('pricePerMeter')}</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('total')}</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('notes')}</th>
                  <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.filter((_, index) => selectedItems.has(index)).map((item, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {item.width} {t('meter')}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {item.length} {t('meter')}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {item.area.toFixed(2)} {t('squareMeter')}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {item.quantity}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {item.category || '-'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {item.pricePerMeter.toFixed(2)} {t('currency')}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left', fontWeight: 'bold' }}>
                      {item.total.toFixed(2)} {t('currency')}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {item.notes || '-'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      {t(item.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: language === 'ar' ? 'right' : 'left', marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h2 style={{ color: '#007bff', marginBottom: '10px' }}>
              {t('grandTotal2')}: {order.items.filter((_, index) => selectedItems.has(index)).reduce((sum, item) => sum + item.total, 0).toFixed(2)} {t('currency')}
            </h2>
            <p style={{ margin: '5px 0' }}>{t('numberOfItems2')}: {selectedItems.size}</p>
            <p style={{ margin: '5px 0' }}>{t('creationDate2')}: {new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '12px', color: '#666' }}>
            <p>{t('thankYou')}</p>
            <p>{t('allRightsReserved')}</p>
          </div>
        </div>

      </div>

      {/* Invoice Selection Modal */}
      <InvoiceSelectionModal
        isOpen={invoiceModal}
        onClose={() => setInvoiceModal(false)}
        onConfirm={generatePDF}
        orderItems={order?.items || []}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        onStatusChange={handleStatusChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteOrder}
        orderInfo={order ? {
          customerName: user ? user.name : `Unknown User (ID: ${order.userId})`,
          totalAmount: order.totalAmount.toFixed(2),
          creationDate: new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')
        } : null}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
};

export default OrderView;
