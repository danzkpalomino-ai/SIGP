import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

let cachedDb = null;

export async function connectDB() {
  if (cachedDb) return cachedDb;
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  console.log('[SIGP] Conectado a MongoDB');
  cachedDb = conn;
  return conn;
}

export function getMainDb() {
  if (!cachedDb) throw new Error('Base de datos no conectada');
  return cachedDb.useDb('sicce_admin');
}

export function getTenantDb(companyId) {
  if (!cachedDb) throw new Error('Base de datos no conectada');
  const prefix = process.env.DB_PREFIX || 'sicce_';
  return cachedDb.useDb(`${prefix}${companyId}`);
}

export default { connectDB, getMainDb, getTenantDb };
