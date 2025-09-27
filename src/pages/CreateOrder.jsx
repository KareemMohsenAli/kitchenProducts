import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import db from '../database';

const CreateOrder = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [userName, setUserName] = useState('');
  const [address, setAddress] = useState('');
  const [advancePayments, setAdvancePayments] = useState([
    { amount: '', date: '' }
  ]);
  const [orderItems, setOrderItems] = useState([
    {
      width: '',
      length: '',
      area: 0,
      quantity: '1',
      category: '',
      pricePerMeter: '',
      total: 0,
      description: '',
      status: 'working'
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recalculate totals on initial load
  useEffect(() => {
    const newItems = orderItems.map(item => {
      const area = calculateArea(item.width, item.length);
      const total = calculateItemTotal(area, item.quantity, item.pricePerMeter);
      return {
        ...item,
        area,
        total
      };
    });
    setOrderItems(newItems);
  }, []); // Only run once on mount

  // Calculate area automatically
  const calculateArea = (width, length) => {
    const w = parseFloat(width) || 0;
    const l = parseFloat(length) || 0;
    return parseFloat((w * l).toFixed(2));
  };

  // Calculate total for an item
  const calculateItemTotal = (area, quantity, pricePerMeter) => {
    const a = parseFloat(area) || 0;
    const q = parseFloat(quantity) || 0;
    const p = parseFloat(pricePerMeter) || 0;
    return parseFloat((a * q * p).toFixed(2));
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return parseFloat(orderItems.reduce((total, item) => total + item.total, 0).toFixed(2));
  };

  // Calculate total advance payments
  const calculateTotalAdvancePayments = () => {
    const total = advancePayments
      .filter(payment => payment.amount && !isNaN(parseFloat(payment.amount)) && parseFloat(payment.amount) > 0)
      .reduce((sum, payment) => {
        return sum + parseFloat(payment.amount);
      }, 0);
    return parseFloat(total.toFixed(2));
  };

  // Calculate total after advance payments
  const calculateTotalAfterAdvance = () => {
    const grandTotal = calculateGrandTotal();
    const totalAdvance = calculateTotalAdvancePayments();
    return parseFloat((grandTotal - totalAdvance).toFixed(2));
  };

  // Add new advance payment
  const addAdvancePayment = () => {
    setAdvancePayments([...advancePayments, { amount: '', date: '' }]);
  };

  // Remove advance payment
  const removeAdvancePayment = (index) => {
    if (advancePayments.length > 1) {
      const newPayments = advancePayments.filter((_, i) => i !== index);
      setAdvancePayments(newPayments);
    }
  };

  // Update advance payment
  const updateAdvancePayment = (index, field, value) => {
    const newPayments = [...advancePayments];
    newPayments[index][field] = value;
    setAdvancePayments(newPayments);
  };

  // Get payment number text
  const getPaymentNumberText = (index) => {
    const numbers = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
    return numbers[index] || `${index + 1}th`;
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

    // Auto-calculate total when width, length, quantity, or price changes
    if (['width', 'length', 'quantity', 'pricePerMeter'].includes(field)) {
      // Recalculate area if width or length changed
      let area = newItems[index].area;
      if (field === 'width' || field === 'length') {
        area = calculateArea(
          field === 'width' ? value : newItems[index].width,
          field === 'length' ? value : newItems[index].length
        );
        newItems[index].area = area;
      }
      
      // Calculate total with current values
      const total = calculateItemTotal(
        area,
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
        quantity: '1',
        category: '',
        pricePerMeter: '',
        total: 0,
        description: ''
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
      toast.error(t('pleaseEnterCustomerName'));
      return;
    }

    if (orderItems.some(item => !item.width || !item.length || !item.quantity || !item.pricePerMeter)) {
      toast.error(t('pleaseFillAllRequiredFields'));
      return;
    }

    setIsSubmitting(true);

    // Retry mechanism for user creation
    let retryCount = 0;
    const maxRetries = 3;

    try {
      // Create or find user with retry mechanism
      let user = null;
      while (retryCount < maxRetries && !user) {
        try {
          user = await db.users.where('name').equals(userName.trim()).first();
          if (!user) {
            const userId = await db.users.add({
              name: userName.trim(),
              createdAt: new Date()
            });
            user = await db.users.get(userId);
          }
          
          // Validate user was created successfully
          if (!user || !user.id) {
            throw new Error('Failed to create or retrieve user');
          }
          break; // Success, exit retry loop
        } catch (userError) {
          retryCount++;
          console.warn(`User creation attempt ${retryCount} failed:`, userError);
          if (retryCount >= maxRetries) {
            throw new Error('Failed to create user after multiple attempts');
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Create order with transaction to ensure atomicity
      const order = await db.transaction('rw', [db.orders], async () => {
        return await db.orders.add({
          userId: user.id,
          items: orderItems.map(item => ({
            width: parseFloat(item.width),
            length: parseFloat(item.length),
            area: parseFloat(item.area),
            quantity: parseFloat(item.quantity),
            category: item.category,
            pricePerMeter: parseFloat(item.pricePerMeter),
            total: parseFloat(item.total),
            description: item.description,
            status: item.status || 'working'
          })),
          totalAmount: calculateGrandTotal(),
          address: address.trim(),
          advancePayments: advancePayments
            .filter(payment => payment.amount && !isNaN(parseFloat(payment.amount)) && parseFloat(payment.amount) > 0)
            .map(payment => ({
              amount: parseFloat(payment.amount),
              date: payment.date || null
            })),
          totalAdvancePayments: calculateTotalAdvancePayments(),
          remainingAmount: calculateTotalAfterAdvance(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      toast.success(t('orderCreatedSuccessfully'));
      
      // Keep loader for a moment to show success message
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
      
      // Reset form
    setUserName('');
    setAddress('');
    setAdvancePayments([{ amount: '', date: '' }]);
      setOrderItems([{
        width: '',
        length: '',
        area: 0,
        quantity: '1',
        category: '',
        pricePerMeter: '',
        total: 0,
        description: '',
        status: 'working'
      }]);

      // Navigate to orders list after showing success message
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error) {
      console.error('Error creating order:', error);
      if (error.message.includes('Failed to create user')) {
        toast.error('Failed to create user. Please try again.');
      } else {
        toast.error(t('errorCreatingOrder'));
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h1 className="card-title">{t('createNewOrder')}</h1>
      

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

        <div className="form-group">
          <label htmlFor="address">{t('address')}</label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t('enterAddress')}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>{t('advancePayment')} {t('details')}</label>
          {advancePayments.map((payment, index) => (
            <div key={index} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '15px',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#333' }}>
                  {t(`${getPaymentNumberText(index)}AdvancePayment`)}
                </h4>
                {advancePayments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAdvancePayment(index)}
                    className="btn btn-danger btn-sm"
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                  >
                    {t('removeAdvancePayment')}
                  </button>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t(`${getPaymentNumberText(index)}AdvancePayment`)} ({t('currency')})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={payment.amount}
                    onChange={(e) => updateAdvancePayment(index, 'amount', e.target.value)}
                    placeholder={t(`enter${getPaymentNumberText(index).charAt(0).toUpperCase() + getPaymentNumberText(index).slice(1)}AdvancePayment`)}
                  />
                </div>

                <div className="form-group">
                  <label>{t(`${getPaymentNumberText(index)}AdvanceDate`)}</label>
                  <input
                    type="date"
                    value={payment.date}
                    onChange={(e) => updateAdvancePayment(index, 'date', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addAdvancePayment}
            className="btn btn-outline-primary"
            style={{ marginBottom: '20px' }}
          >
            {t('addAdvancePayment')}
          </button>
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

            <div className="form-group">
              <label>{t('description')}</label>
              <textarea
                value={item.description}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                placeholder={t('anyAdditionalNotes')}
                rows="3"
              />
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
                  step="1"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  placeholder="1"
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
          <div style={{ marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>
              {t('grandTotal')}: <strong>{calculateGrandTotal().toFixed(2)} {t('currency')}</strong>
            </h3>
          </div>
          
          {calculateTotalAdvancePayments() > 0 && (
            <>
              {advancePayments.map((payment, index) => (
                payment.amount && !isNaN(parseFloat(payment.amount)) && parseFloat(payment.amount) > 0 && (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      {t(`${getPaymentNumberText(index)}AdvancePayment`)}: <strong>-{parseFloat(payment.amount).toFixed(2)} {t('currency')}</strong>
                      {payment.date && <span style={{ fontSize: '0.9em', marginLeft: '10px' }}>({payment.date})</span>}
                    </p>
                  </div>
                )
              ))}
              
              <div style={{ borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                <h3 style={{ margin: 0, color: '#007bff' }}>
                  {t('residualAmount')}: <strong>{calculateTotalAfterAdvance().toFixed(2)} {t('currency')}</strong>
                </h3>
              </div>
            </>
          )}
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
            onClick={() => navigate('/')}
          >
            {t('viewAllOrders')}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreateOrder;
