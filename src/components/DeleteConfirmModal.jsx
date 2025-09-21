import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, orderInfo, isLoading, isUserDelete = false }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            <span className="warning-icon">⚠️</span>
            {isUserDelete ? t('confirmDeleteUser') : t('confirmDeleteOrder')}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="warning-message">
            <p>{isUserDelete ? t('confirmDeleteUser') : t('confirmDeleteOrder')}</p>
            {orderInfo && (
              <div className="order-info">
                <p><strong>{isUserDelete ? t('name') : t('customer')}:</strong> {orderInfo.customerName}</p>
                <p><strong>{isUserDelete ? t('userOrdersCount') : t('totalAmount')}:</strong> {orderInfo.totalAmount} {!isUserDelete && t('currency')}</p>
                <p><strong>{t('creationDate')}:</strong> {orderInfo.creationDate}</p>
              </div>
            )}
            <p className="warning-text">
              {t('thisActionCannotBeUndone')}
            </p>
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('cancel')}
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="btn-spinner"></span>
                {t('deleting')}...
              </>
            ) : (
              <>
                <span className="delete-icon">🗑️</span>
                {isUserDelete ? t('deleteUser') : t('delete')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
