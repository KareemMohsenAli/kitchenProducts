import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import db from '../database';

const CreateOrder = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [userName, setUserName] = useState('');
  const [orderItems, setOrderItems] = useState([
    {
      width: '',
      length: '',
      area: 0,
      quantity: '',
      category: '',
      pricePerMeter: '',
      total: 0,
      notes: ''
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Calculate area automatically
  const calculateArea = (width, length) => {
    const w = parseFloat(width) || 0;
    const l = parseFloat(length) || 0;
    return w * l;
  };

  // Calculate total for an item
  const calculateItemTotal = (area, quantity, pricePerMeter) => {
    const a = parseFloat(area) || 0;
    const q = parseFloat(quantity) || 0;
    const p = parseFloat(pricePerMeter) || 0;
    return a * q * p;
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return orderItems.reduce((total, item) => total + item.total, 0);
  };

  // Handle input changes
  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-calculate area when width or length changes
    if (field === 'width' || field === 'length') {
      const area = calculateArea(
        field === 'width' ? value : newItems[index].width,
        field === 'length' ? value : newItems[index].length
      );
      newItems[index].area = area;
    }

    // Auto-calculate total when area, quantity, or price changes
    if (['area', 'quantity', 'pricePerMeter'].includes(field)) {
      const total = calculateItemTotal(
        newItems[index].area,
        newItems[index].quantity,
        newItems[index].pricePerMeter
      );
      newItems[index].total = total;
    }

    setOrderItems(newItems);
  };

  // Add new item
  const addNewItem = () => {
    setOrderItems([
      ...orderItems,
      {
        width: '',
        length: '',
        area: 0,
        quantity: '',
        category: '',
        pricePerMeter: '',
        total: 0,
        notes: ''
      }
    ]);
  };

  // Remove item
  const removeItem = (index) => {
    if (orderItems.length > 1) {
      const newItems = orderItems.filter((_, i) => i !== index);
      setOrderItems(newItems);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      setMessage({ type: 'error', text: t('pleaseEnterCustomerName') });
      return;
    }

    if (orderItems.some(item => !item.width || !item.length || !item.quantity || !item.pricePerMeter)) {
      setMessage({ type: 'error', text: t('pleaseFillAllRequiredFields') });
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // Create or find user
      let user = await db.users.where('name').equals(userName.trim()).first();
      if (!user) {
        user = await db.users.add({
          name: userName.trim(),
          createdAt: new Date()
        });
      }

      // Create order
      const order = await db.orders.add({
        userId: user.id,
        items: orderItems.map(item => ({
          width: parseFloat(item.width),
          length: parseFloat(item.length),
          area: parseFloat(item.area),
          quantity: parseFloat(item.quantity),
          category: item.category,
          pricePerMeter: parseFloat(item.pricePerMeter),
          total: parseFloat(item.total),
          notes: item.notes
        })),
        totalAmount: calculateGrandTotal(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setMessage({ type: 'success', text: t('orderCreatedSuccessfully') });
      
      // Keep loader for a moment to show success message
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
      
      // Reset form
      setUserName('');
      setOrderItems([{
        width: '',
        length: '',
        area: 0,
        quantity: '',
        category: '',
        pricePerMeter: '',
        total: 0,
        notes: ''
      }]);

      // Navigate to orders list after showing success message
      setTimeout(() => {
        navigate('/orders');
      }, 3000);

    } catch (error) {
      console.error('Error creating order:', error);
      setMessage({ type: 'error', text: t('errorCreatingOrder') });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h1 className="card-title">{t('createNewOrder')}</h1>
      
      {message && message.type === 'error' && (
        <div className="error">
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="userName">{t('customerName')} *</label>
          <input
            type="text"
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={t('enterCustomerName')}
            required
          />
        </div>

        <h3 style={{ marginBottom: '20px', color: '#333' }}>{t('orderDetails')}</h3>

        {orderItems.map((item, index) => (
          <div key={index} className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h4>{t('item')} {index + 1}</h4>
              {orderItems.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeItem(index)}
                  style={{ float: 'left' }}
                >
                  {t('deleteItem')}
                </button>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t('width')} ({t('meter')}) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.width}
                  onChange={(e) => handleItemChange(index, 'width', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('length')} ({t('meter')}) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.length}
                  onChange={(e) => handleItemChange(index, 'length', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('area')} ({t('squareMeter')})</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.area}
                  readOnly
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              </div>

              <div className="form-group">
                <label>{t('quantity')} *</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('category')}</label>
                <select
                  value={item.category}
                  onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                >
                  <option value="">{t('chooseCategory')}</option>
                  <option value={t('windows')}>{t('windows')}</option>
                  <option value={t('doors')}>{t('doors')}</option>
                  <option value={t('kitchens')}>{t('kitchens')}</option>
                  <option value={t('windows2')}>{t('windows2')}</option>
                  <option value={t('other')}>{t('other')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('pricePerMeter')} ({t('currency')}) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.pricePerMeter}
                  onChange={(e) => handleItemChange(index, 'pricePerMeter', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('total')} ({t('currency')})</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.total}
                  readOnly
                  style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('notes')}</label>
              <textarea
                value={item.notes}
                onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                placeholder={t('anyAdditionalNotes')}
                rows="3"
              />
            </div>
          </div>
        ))}

        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addNewItem}
          >
            + {t('addNewItem')}
          </button>
        </div>

        <div className="card" style={{ backgroundColor: '#f8f9fa' }}>
          <h3 style={{ margin: 0, color: '#333' }}>
            {t('grandTotal')}: {calculateGrandTotal().toFixed(2)} {t('currency')}
          </h3>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            type="submit"
            className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`}
            disabled={isSubmitting}
            style={{ marginLeft: '10px' }}
          >
            <span className="btn-text">
              {isSubmitting ? t('saving') : t('saveOrder')}
            </span>
            {isSubmitting && <div className="btn-spinner"></div>}
          </button>
          
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/orders')}
          >
            {t('viewAllOrders')}
          </button>
        </div>

        {message && message.type === 'success' && (
          <div className="success" style={{ marginTop: '20px' }}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateOrder;
