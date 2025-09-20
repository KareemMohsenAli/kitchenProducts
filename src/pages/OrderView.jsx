import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import db from '../database';

const OrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
    } catch (error) {
      console.error('Error loading order:', error);
      setMessage({ type: 'error', text: t('errorLoadingOrder') });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
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
      
      pdf.save(`eslam-order-${user?.name}-${language}-${new Date().toISOString().split('T')[0]}.pdf`);
      setMessage({ type: 'success', text: t('invoiceGeneratedSuccessfully') });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setMessage({ type: 'error', text: t('errorGeneratingInvoice') });
    }
  };

  const deleteOrder = async () => {
    if (window.confirm(t('confirmDeleteOrder'))) {
      try {
        await db.orders.delete(parseInt(id));
        setMessage({ type: 'success', text: t('orderDeletedSuccessfully') });
        navigate('/');
      } catch (error) {
        console.error('Error deleting order:', error);
        setMessage({ type: 'error', text: t('errorDeletingOrder') });
      }
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
            <button className="btn btn-success" onClick={generatePDF}>
              {t('generatePDFInvoice')}
            </button>
            <button className="btn btn-danger" onClick={deleteOrder}>
              {t('deleteOrder')}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              {t('backToOrders')}
            </button>
          </div>
        </div>

        {message && (
          <div className={message.type === 'error' ? 'error' : 'success'}>
            {message.text}
          </div>
        )}

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
            <p>{t('orderDate')}: {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3>{t('customerData')}</h3>
            <p><strong>{t('name')}:</strong> {user.name}</p>
            <p><strong>{t('orderNumber')}:</strong> #{order.id}</p>
            <p><strong>{t('creationDate2')}:</strong> {new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
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
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ textAlign: language === 'ar' ? 'right' : 'left', marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <h2 style={{ color: '#007bff', marginBottom: '10px' }}>
              {t('grandTotal2')}: {order.totalAmount.toFixed(2)} {t('currency')}
            </h2>
            <p style={{ margin: '5px 0' }}>{t('numberOfItems2')}: {order.items.length}</p>
            <p style={{ margin: '5px 0' }}>{t('creationDate2')}: {new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '12px', color: '#666' }}>
            <p>{t('thankYou')}</p>
            <p>{t('allRightsReserved')}</p>
          </div>
        </div>

        {/* Regular View (not for PDF) */}
        <div style={{ marginTop: '30px' }}>
          <div className="card">
            <h3>{t('customerData')}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>{t('name')}</label>
                <input type="text" value={user.name} readOnly style={{ backgroundColor: '#f8f9fa' }} />
              </div>
              <div className="form-group">
                <label>{t('orderNumber')}</label>
                <input type="text" value={`#${order.id}`} readOnly style={{ backgroundColor: '#f8f9fa' }} />
              </div>
              <div className="form-group">
                <label>{t('creationDate2')}</label>
                <input type="text" value={new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} readOnly style={{ backgroundColor: '#f8f9fa' }} />
              </div>
            </div>
          </div>

          <div className="card">
            <h3>{t('orderDetails3')}</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('width')}</th>
                    <th>{t('length')}</th>
                    <th>{t('area')}</th>
                    <th>{t('quantity')}</th>
                    <th>{t('category')}</th>
                    <th>{t('pricePerMeter')}</th>
                    <th>{t('total')}</th>
                    <th>{t('notes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.width} {t('meter')}</td>
                      <td>{item.length} {t('meter')}</td>
                      <td>{item.area.toFixed(2)} {t('squareMeter')}</td>
                      <td>{item.quantity}</td>
                      <td>{item.category || '-'}</td>
                      <td>{item.pricePerMeter.toFixed(2)} {t('currency')}</td>
                      <td style={{ fontWeight: 'bold' }}>{item.total.toFixed(2)} {t('currency')}</td>
                      <td>{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
            <h2 style={{ color: '#007bff', marginBottom: '10px' }}>
              {t('grandTotal2')}: {order.totalAmount.toFixed(2)} {t('currency')}
            </h2>
            <p>{t('numberOfItems2')}: {order.items.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderView;
