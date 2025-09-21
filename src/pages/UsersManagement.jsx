import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';
import db from '../database';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const UsersManagement = () => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    userId: null,
    userInfo: null,
    isLoading: false
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await db.users.toArray();
      const allOrders = await db.orders.toArray();
      
      // Count orders for each user
      const usersWithOrderCount = allUsers.map(user => {
        const orderCount = allOrders.filter(order => order.userId === user.id).length;
        return {
          ...user,
          orderCount
        };
      });
      
      setUsers(usersWithOrderCount);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error(t('errorLoadingOrders'));
    } finally {
      setLoading(false);
    }
  };

  const showDeleteModal = (userId) => {
    const user = users.find(u => u.id === userId);
    
    setDeleteModal({
      isOpen: true,
      userId,
      userInfo: user ? {
        userName: user.name,
        orderCount: user.orderCount,
        creationDate: new Date(user.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')
      } : null,
      isLoading: false
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      userId: null,
      userInfo: null,
      isLoading: false
    });
  };

  const confirmDeleteUser = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));

    try {
      // First delete all orders for this user
      await db.orders.where('userId').equals(deleteModal.userId).delete();
      
      // Then delete the user
      await db.users.delete(deleteModal.userId);
      
      toast.success(t('userDeletedSuccessfully'));
      loadUsers(); // Reload users list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(t('errorDeletingUser'));
    } finally {
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
      closeDeleteModal();
    }
  };

  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">{t('usersManagement')}</h1>
          <button 
            className="btn btn-secondary" 
            onClick={loadUsers}
          >
            {t('refresh')}
          </button>
        </div>

        {users.length === 0 ? (
          <div className="no-data">
            <p>{t('noUsersFound')}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('name')}</th>
                  <th>{t('userOrdersCount')}</th>
                  <th>{t('creationDate')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.orderCount}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                    <td>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => showDeleteModal(user.id)}
                        disabled={user.orderCount > 0}
                        title={user.orderCount > 0 ? t('cannotDeleteUserWithOrders') : ''}
                      >
                        {t('deleteUser')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="card-footer">
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            {t('usersManagementNote')}
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteUser}
        orderInfo={deleteModal.userInfo ? {
          customerName: deleteModal.userInfo.userName,
          totalAmount: deleteModal.userInfo.orderCount,
          creationDate: deleteModal.userInfo.creationDate
        } : null}
        isLoading={deleteModal.isLoading}
        isUserDelete={true}
      />
    </div>
  );
};

export default UsersManagement;
