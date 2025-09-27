import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './InvoiceSelectionModal.css';

const InvoiceSelectionModal = ({ isOpen, onClose, onConfirm, orderItems, selectedItems, setSelectedItems, onStatusChange, advancePayment = null, remainingAmount = null }) => {
  const { t, language } = useLanguage();
  const [localSelectedItems, setLocalSelectedItems] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedItems(new Set(selectedItems));
    }
  }, [isOpen, selectedItems]);

  if (!isOpen) return null;

  const toggleItemSelection = (index) => {
    const newSelectedItems = new Set(localSelectedItems);
    if (newSelectedItems.has(index)) {
      newSelectedItems.delete(index);
    } else {
      newSelectedItems.add(index);
    }
    setLocalSelectedItems(newSelectedItems);
  };

  const selectAllItems = () => {
    const allItemIndices = new Set(orderItems.map((_, index) => index));
    setLocalSelectedItems(allItemIndices);
  };

  const deselectAllItems = () => {
    setLocalSelectedItems(new Set());
  };

  const handleStatusChange = async (itemIndex) => {
    if (onStatusChange) {
      await onStatusChange(itemIndex);
    }
  };

  const handleConfirm = () => {
    setSelectedItems(localSelectedItems);
    onConfirm();
    onClose();
  };

  const calculateSelectedTotal = () => {
    return orderItems
      .filter((_, index) => localSelectedItems.has(index))
      .reduce((sum, item) => sum + item.total, 0);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content invoice-selection-modal" onClick={(e) => e.stopPropagation()} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="modal-header">
          <h3 className="modal-title">
            <span className="invoice-icon">📄</span>
            {t('selectItemsForInvoice')}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="selection-controls">
            <button className="btn btn-sm btn-secondary" onClick={selectAllItems}>
              {t('selectAll')}
            </button>
            <button className="btn btn-sm btn-secondary" onClick={deselectAllItems}>
              {t('deselectAll')}
            </button>
            <span className="selection-count">
              {localSelectedItems.size} / {orderItems.length} {t('itemsSelected')}
            </span>
          </div>

          <div className="items-list">
            {orderItems.map((item, index) => (
              <div 
                key={index} 
                className={`item-selection-card ${localSelectedItems.has(index) ? 'selected' : ''}`}
                onClick={() => toggleItemSelection(index)}
              >
                <div className="item-checkbox">
                  <input
                    type="checkbox"
                    checked={localSelectedItems.has(index)}
                    onChange={() => toggleItemSelection(index)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                <div className="item-details">
                  <div className="item-info">
                    <span className="item-number">{t('item')} {index + 1}</span>
                    <span className="item-category">{item.category || t('uncategorized')}</span>
                    <span className={`item-status status-${item.status}`}>
                      {t(item.status)}
                    </span>
                    <button 
                      className="status-toggle-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(index);
                      }}
                      title={t('toggleStatus')}
                    >
                      {item.status === 'working' ? '⏳' : '✅'}
                    </button>
                  </div>
                  
                  <div className="item-specs">
                    <span>{item.width} × {item.length} {t('meter')}</span>
                    <span>{t('quantity')}: {item.quantity}</span>
                    <span>{item.pricePerMeter.toFixed(2)} {t('currency')}/{t('meter')}</span>
                  </div>
                </div>
                
                <div className="item-total">
                  <strong>{item.total.toFixed(2)} {t('currency')}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="selection-summary">
            <div className="summary-row">
              <span>{t('selectedItems')}: {localSelectedItems.size}</span>
              <span>{t('totalAmount')}: <strong>{calculateSelectedTotal().toFixed(2)} {t('currency')}</strong></span>
            </div>
            {advancePayment !== null && advancePayment !== undefined && parseFloat(advancePayment) > 0 && (
              <div style={{ 
                marginTop: '15px', 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb'
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '16px', 
                  color: '#374151',
                  fontWeight: '600'
                }}>
                  {t('advancePayment')} {t('details')}
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>{t('totalBeforeAdvance')}:</span>
                  <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                    {calculateSelectedTotal().toFixed(2)} {t('currency')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>{t('advancePayment')}:</span>
                  <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                    -{advancePayment.toFixed(2)} {t('currency')}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  paddingTop: '8px',
                  borderTop: '1px solid #d1d5db'
                }}>
                  <span style={{ fontSize: '16px', color: '#007bff', fontWeight: 'bold' }}>
                    {t('totalAfterAdvance')}:
                  </span>
                  <span style={{ fontSize: '16px', color: '#007bff', fontWeight: 'bold' }}>
                    {((remainingAmount || calculateSelectedTotal()) * (localSelectedItems.size / orderItems.length)).toFixed(2)} {t('currency')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            {t('cancel')}
          </button>
          <button
            className="btn btn-success"
            onClick={handleConfirm}
            disabled={localSelectedItems.size === 0}
          >
            <span className="invoice-icon">📄</span>
            {t('generateSelectedInvoice')} ({localSelectedItems.size})
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSelectionModal;
