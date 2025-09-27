import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import db from '../database';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import InvoiceSelectionModal from '../components/InvoiceSelectionModal';
import '../components/InvoiceTable.css';

const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  // State management
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, isLoading: false });
  const [invoiceModal, setInvoiceModal] = useState(false);

  // Load order data
  useEffect(() => {
    loadOrder();
  }, [id]);

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    if (invoiceModal) {
      document.body.style.overflowX = 'hidden';
    } else {
      document.body.style.overflowX = 'auto';
    }
    return () => {
      document.body.style.overflowX = 'auto';
    };
  }, [invoiceModal]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await db.orders.get(parseInt(id));
      
      if (!orderData) {
        toast.error(t('orderNotFound2'));
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

  // Generate PDF with proper page handling
  const generatePDF = async (taxFile = '') => {
    if (selectedItems.size === 0) {
      toast.error(t('selectItemsForInvoice'));
      return;
    }

    const loadingToast = toast.loading(t('generatingPDF') || 'Generating PDF...');

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const element = document.getElementById('invoice-content');
      if (!element) {
        throw new Error('Invoice content element not found');
      }

      // Handle tax file display
      const taxFileDisplay = element.querySelector('#tax-file-display');
      const taxFileValue = element.querySelector('#tax-file-value');
      
      if (taxFile && taxFile.trim()) {
        if (taxFileDisplay && taxFileValue) {
          taxFileValue.textContent = taxFile.trim();
          taxFileDisplay.style.display = 'block';
        }
      } else {
        if (taxFileDisplay) {
          taxFileDisplay.style.display = 'none';
        }
      }
      
      // Temporarily make element visible for capture
      const originalStyle = {
        position: element.style.position,
        left: element.style.left,
        top: element.style.top,
        opacity: element.style.opacity,
        pointerEvents: element.style.pointerEvents,
        zIndex: element.style.zIndex,
        transform: element.style.transform,
        visibility: element.style.visibility
      };
      
      element.style.position = 'fixed';
      element.style.left = '-10000px';
      element.style.top = '0px';
      element.style.opacity = '1';
      element.style.pointerEvents = 'none';
      element.style.zIndex = '9999';
      element.style.transform = 'none';
      element.style.visibility = 'visible';
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Restore original styles
      Object.keys(originalStyle).forEach(key => {
        element.style[key] = originalStyle[key];
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width
      const pageHeight = 295; // A4 height
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Dynamic page generation based on content size
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }
      
      const selectedCount = selectedItems.size;
      const totalCount = order.items.length;
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${user?.name}-${timestamp}.pdf`;
      
      pdf.save(filename);
      toast.dismiss(loadingToast);
      toast.success(t('invoiceGeneratedSuccessfully'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss(loadingToast);
      toast.error(t('errorGeneratingInvoice'));
    }
  };

  // Modal handlers
  const showDeleteModal = () => {
    setDeleteModal({ isOpen: true, isLoading: false });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, isLoading: false });
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

  // Loading state
  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  // Error state
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

  // Table cell styling
  const tableCellStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    fontSize: '10px',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    overflow: 'hidden'
  };

  const headerCellStyle = {
    ...tableCellStyle,
    backgroundColor: '#f8f9fa',
    textAlign: language === 'ar' ? 'right' : 'left',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  };

  const dataCellStyle = (textAlign) => ({
    ...tableCellStyle,
    textAlign: textAlign || (language === 'ar' ? 'right' : 'left'),
    whiteSpace: 'normal',
    wordWrap: 'break-word'
  });

  return (
    <div style={{ 
      overflow: 'hidden', 
      width: '100%', 
      maxWidth: '100vw',
      direction: language === 'ar' ? 'rtl' : 'ltr'
    }}>
      <div className="card" style={{ 
        overflow: 'hidden', 
        width: '100%', 
        maxWidth: '100%',
        margin: '0',
        padding: '0'
      }}>
        {/* Header */}
        <div className="card-header" style={{ 
          width: '100%', 
          maxWidth: '100%',
          overflow: 'hidden'
        }}>
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

        {/* Order Details Display - Always show ALL items */}
        <div className="card-body" style={{ 
          overflow: 'hidden', 
          width: '100%', 
          maxWidth: '100%',
          padding: '15px'
        }}>
          <div style={{ marginBottom: '30px' }}>
            <h3>{t('customerData')}</h3>
            <p><strong>{t('name')}:</strong> {user.name}</p>
            <p><strong>{t('orderNumber')}:</strong> #{order.id}</p>
            <p><strong>{t('creationDate2')}:</strong> {new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3>{t('orderDetails3')}</h3>
            <div style={{ 
              width: '100%', 
              maxWidth: '100%', 
              overflow: 'hidden',
              margin: '0', 
              padding: '0'
            }}>
              <div style={{ 
                overflowX: 'auto', 
                width: '100%', 
                maxWidth: '100%',
                WebkitOverflowScrolling: 'touch'
              }}>
                <table className="invoice-table" style={{ 
                  width: '100%', 
                  minWidth: '800px',
                  borderCollapse: 'collapse', 
                  marginTop: '10px',
                  tableLayout: 'fixed'
                }}>
                  <thead>
                    <tr>
                      <th style={{...headerCellStyle, width: '25%'}}>{t('description')}</th>
                      <th style={{...headerCellStyle, width: '8%'}}>{t('width')}</th>
                      <th style={{...headerCellStyle, width: '8%'}}>{t('length')}</th>
                      <th style={{...headerCellStyle, width: '8%'}}>{t('area')}</th>
                      <th style={{...headerCellStyle, width: '6%'}}>{t('quantity')}</th>
                      <th style={{...headerCellStyle, width: '8%'}}>{t('category')}</th>
                      <th style={{...headerCellStyle, width: '10%'}}>{t('pricePerMeter')}</th>
                      <th style={{...headerCellStyle, width: '10%'}}>{t('total')}</th>
                      <th style={{...headerCellStyle, width: '9%'}}>{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td style={{...dataCellStyle(), wordWrap: 'break-word', whiteSpace: 'normal'}}>
                          {item.description || '-'}
                        </td>
                        <td style={dataCellStyle()}>{item.width} {t('meter')}</td>
                        <td style={dataCellStyle()}>{item.length} {t('meter')}</td>
                        <td style={dataCellStyle()}>{item.area.toFixed(2)} {t('squareMeter')}</td>
                        <td style={dataCellStyle()}>{item.quantity}</td>
                        <td style={dataCellStyle()}>{item.category || '-'}</td>
                        <td style={dataCellStyle()}>{item.pricePerMeter.toFixed(2)} {t('currency')}</td>
                        <td style={{ ...dataCellStyle(), fontWeight: 'bold' }}>{item.total.toFixed(2)} {t('currency')}</td>
                        <td style={dataCellStyle()}>
                          <button
                            type="button"
                            className={`btn btn-sm ${item.status === 'done' ? 'btn-success' : 'btn-warning'}`}
                            onClick={() => toggleItemStatus(index)}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            {t(item.status)}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

           <div style={{ textAlign: language === 'ar' ? 'right' : 'left', marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
             <div style={{ marginBottom: '15px' }}>
               <h3 style={{ color: '#333', marginBottom: '5px' }}>
                 {t('grandTotal2')}: <strong>{order.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)} {t('currency')}</strong>
               </h3>
             </div>
             
             {order.address && (
               <div style={{ marginBottom: '15px' }}>
                 <p style={{ margin: '5px 0', color: '#666' }}>
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
                       <div key={index} style={{ marginBottom: '10px' }}>
                         <p style={{ margin: '5px 0', color: '#666' }}>
                           {t(`${getPaymentNumberText(index)}AdvancePayment`)}: <strong>-{parseFloat(payment.amount).toFixed(2)} {t('currency')}</strong>
                           {payment.date && <span style={{ fontSize: '0.9em', marginLeft: '10px' }}>({payment.date})</span>}
                         </p>
                       </div>
                     )
                   ))}
                   
                   <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                     <h2 style={{ color: '#007bff', marginBottom: '10px' }}>
                       {t('residualAmount')}: <strong>{(order.remainingAmount || order.items.reduce((sum, item) => sum + item.total, 0) - payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)).toFixed(2)} {t('currency')}</strong>
                     </h2>
                   </div>
                 </>
               );
             })()}
             
             <p style={{ margin: '5px 0' }}>{t('numberOfItems2')}: <strong>{order.items.length}</strong></p>
             <p style={{ margin: '5px 0' }}>{t('creationDate2')}: <strong>{new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</strong></p>
           </div>
        </div>

        {/* Hidden Invoice Content for PDF - Only shows selected items */}
        <div 
          id="invoice-content" 
          key={`invoice-${selectedItems.size}-${Array.from(selectedItems).join('-')}`}
          style={{ 
            backgroundColor: 'white', 
            padding: '20px',
            direction: language === 'ar' ? 'rtl' : 'ltr',
            textAlign: language === 'ar' ? 'right' : 'left',
            position: 'absolute',
            left: '-10000px',
            top: '0px',
            width: '210mm',
            minHeight: 'auto',
            maxHeight: 'none',
            opacity: '0',
            pointerEvents: 'none',
            zIndex: '-1',
            fontSize: '12px',
            lineHeight: '1.4'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#007bff', marginBottom: '10px' }}>{t('companyName')}</h1>
            <h2>{t('invoice')}</h2>
            <p><strong>{t('orderDate')}:</strong> <strong>{new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</strong></p>
          </div>

          {/* Tax File Display - Top Left */}
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            left: language === 'ar' ? '20px' : '20px', 
            right: language === 'ar' ? 'auto' : 'auto',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
            display: 'none' // Will be shown via JavaScript when taxFile is provided
          }} id="tax-file-display">
            <strong>{t('taxFile')}:</strong> <span id="tax-file-value"></span>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3>{t('customerData')}</h3>
            <p><strong>{t('name')}:</strong> <strong>{user.name}</strong></p>
            <p><strong>{t('orderNumber')}:</strong> <strong>#{order.id}</strong></p>
            {order.address && <p><strong>{t('address')}:</strong> <strong>{order.address}</strong></p>}
            <p><strong>{t('creationDate2')}:</strong> <strong>{new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</strong></p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3>{t('orderDetails3')}</h3>
            <div className="table-responsive">
              <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: language === 'ar' ? 'right' : 'left', fontSize: '10px', verticalAlign: 'top', width: '25%' }}>{t('description')}</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: language === 'ar' ? 'right' : 'left', fontSize: '10px', verticalAlign: 'top', width: '8%' }}>{t('width')}</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: language === 'ar' ? 'right' : 'left', fontSize: '10px', verticalAlign: 'top', width: '8%' }}>{t('length')}</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: language === 'ar' ? 'right' : 'left', fontSize: '10px', verticalAlign: 'top', width: '8%' }}>{t('area')}</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: language === 'ar' ? 'right' : 'left', fontSize: '10px', verticalAlign: 'top', width: '6%' }}>{t('quantity')}</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: language === 'ar' ? 'right' : 'left', fontSize: '10px', verticalAlign: 'top', width: '8%' }}>{t('category')}</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: language === 'ar' ? 'right' : 'left', fontSize: '10px', verticalAlign: 'top', width: '10%' }}>{t('pricePerMeter')}</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: language === 'ar' ? 'right' : 'left', fontSize: '10px', verticalAlign: 'top', width: '10%' }}>{t('total')}</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: language === 'ar' ? 'right' : 'left', fontSize: '10px', verticalAlign: 'top', width: '9%' }}>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.filter((_, index) => selectedItems.has(index)).map((item, index) => (
                    <tr key={index}>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: language === 'ar' ? 'right' : 'left', 
                        fontSize: '10px',
                        verticalAlign: 'top',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        lineHeight: '1.3',
                        maxWidth: '200px'
                      }}>
                        {item.description || '-'}
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: language === 'ar' ? 'right' : 'left', 
                        fontSize: '10px',
                        verticalAlign: 'top',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        lineHeight: '1.3',
                        fontWeight: 'bold'
                      }}>
                        <strong>{item.width} {t('meter')}</strong>
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: language === 'ar' ? 'right' : 'left', 
                        fontSize: '10px',
                        verticalAlign: 'top',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        lineHeight: '1.3',
                        fontWeight: 'bold'
                      }}>
                        <strong>{item.length} {t('meter')}</strong>
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: language === 'ar' ? 'right' : 'left', 
                        fontSize: '10px',
                        verticalAlign: 'top',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        lineHeight: '1.3',
                        fontWeight: 'bold'
                      }}>
                        <strong>{item.area.toFixed(2)} {t('squareMeter')}</strong>
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: language === 'ar' ? 'right' : 'left', 
                        fontSize: '10px',
                        verticalAlign: 'top',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        lineHeight: '1.3',
                        fontWeight: 'bold'
                      }}>
                        <strong>{item.quantity}</strong>
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: language === 'ar' ? 'right' : 'left', 
                        fontSize: '10px',
                        verticalAlign: 'top',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        lineHeight: '1.3',
                        fontWeight: 'bold'
                      }}>
                        <strong>{item.category || '-'}</strong>
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: language === 'ar' ? 'right' : 'left', 
                        fontSize: '10px',
                        verticalAlign: 'top',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        lineHeight: '1.3',
                        fontWeight: 'bold'
                      }}>
                        <strong>{item.pricePerMeter.toFixed(2)} {t('currency')}</strong>
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: language === 'ar' ? 'right' : 'left', 
                        fontSize: '10px',
                        verticalAlign: 'top',
                        fontWeight: 'bold',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        lineHeight: '1.3'
                      }}>
                        <strong>{item.total.toFixed(2)} {t('currency')}</strong>
                      </td>
                      <td style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px', 
                        textAlign: language === 'ar' ? 'right' : 'left', 
                        fontSize: '10px',
                        verticalAlign: 'top',
                        wordWrap: 'break-word',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        lineHeight: '1.3',
                        fontWeight: 'bold'
                      }}>
                        <strong>{t(item.status)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

           <div style={{ textAlign: language === 'ar' ? 'right' : 'left', marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
             <div style={{ marginBottom: '15px' }}>
               <h3 style={{ color: '#333', marginBottom: '5px' }}>
                 {t('grandTotal2')}: <strong style={{ fontSize: '20px', fontWeight: 'bold' }}>{order.items.filter((_, index) => selectedItems.has(index)).reduce((sum, item) => sum + item.total, 0).toFixed(2)} {t('currency')}</strong>
               </h3>
             </div>
             
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
                       <div key={index} style={{ marginBottom: '10px' }}>
                         <p style={{ margin: '5px 0', color: '#666' }}>
                           {t(`${getPaymentNumberText(index)}AdvancePayment`)}: <strong style={{ fontSize: '18px', fontWeight: 'bold' }}>-{parseFloat(payment.amount).toFixed(2)} {t('currency')}</strong>
                           {payment.date && <span style={{ fontSize: '0.9em', marginLeft: '10px' }}>({payment.date})</span>}
                         </p>
                       </div>
                     )
                   ))}
                   
                   <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                     <h2 style={{ color: '#007bff', marginBottom: '10px' }}>
                       {t('residualAmount')}: <strong style={{ fontSize: '20px', fontWeight: 'bold' }}>{((order.remainingAmount || order.items.reduce((sum, item) => sum + item.total, 0) - payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)) * (selectedItems.size / order.items.length)).toFixed(2)} {t('currency')}</strong>
                     </h2>
                   </div>
                 </>
               );
             })()}
             
             <p style={{ margin: '5px 0' }}>{t('numberOfItems2')}: <strong>{selectedItems.size}</strong></p>
             <p style={{ margin: '5px 0' }}>{t('creationDate2')}: <strong>{new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</strong></p>
           </div>

          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '12px', color: '#666' }}>
            <p>{t('thankYou')}</p>
            <p>{t('allRightsReserved')}</p>
          </div>
        </div>
      </div>

      {/* Invoice Selection Modal */}
      {invoiceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, overflow: 'hidden' }}>
          <InvoiceSelectionModal
            isOpen={invoiceModal}
            onClose={() => setInvoiceModal(false)}
            onConfirm={generatePDF}
            orderItems={order?.items || []}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            onStatusChange={handleStatusChange}
            advancePayments={order?.advancePayments || null}
            remainingAmount={order?.remainingAmount || null}
          />
        </div>
      )}

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