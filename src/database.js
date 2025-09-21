import Dexie from 'dexie';

const db = new Dexie('EslamAluminumOrdersDB');

db.version(1).stores({
  users: '++id, name, createdAt',
  orders: '++id, userId, totalAmount, createdAt, updatedAt'
});

// Add migration for status field in order items
db.version(2).stores({
  users: '++id, name, createdAt',
  orders: '++id, userId, totalAmount, createdAt, updatedAt'
}).upgrade(tx => {
  return tx.orders.toCollection().modify(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items = order.items.map(item => ({
        ...item,
        status: item.status || 'working' // Default to 'working' for existing items
      }));
    }
  });
});

export default db;
