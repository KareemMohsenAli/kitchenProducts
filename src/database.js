import Dexie from 'dexie';

const db = new Dexie('EslamAluminumOrdersDB');

db.version(1).stores({
  users: '++id, name, createdAt',
  orders: '++id, userId, totalAmount, createdAt, updatedAt'
});

export default db;
