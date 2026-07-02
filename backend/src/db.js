import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { registerModels } from './models/index.js';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sicce_admin';
const tenantModelsRegistered = new Set();

export async function connectDB() {
  await mongoose.connect(MONGO_URI);
  const host = mongoose.connection.host || 'localhost';
  const dbName = mongoose.connection.name || 'unknown';
  const port = mongoose.connection.port || 27017;
  console.log(`[SIGP] MongoDB conectado exitosamente a: ${dbName} en ${host}:${port}`);
  console.log(`[SIGP] URI: ${MONGO_URI}`);
}

export function getMainDb() {
  return mongoose.connection;
}

export function getTenantDb(companyId) {
  if (!companyId) {
    console.warn('[SIGP] company_id es null/undefined, usando main db');
    const fallbackDb = mongoose.connection.useDb('sicce_admin', { noListener: true, useCache: true });
    if (!tenantModelsRegistered.has('sicce_admin')) {
      registerModels(fallbackDb);
      tenantModelsRegistered.add('sicce_admin');
    }
    return fallbackDb;
  }
  const prefix = process.env.DB_PREFIX || 'sicce_';
  const dbName = `${prefix}${companyId}`;
  const db = mongoose.connection.useDb(dbName, { noListener: true, useCache: true });
  if (!tenantModelsRegistered.has(dbName)) {
    registerModels(db);
    tenantModelsRegistered.add(dbName);
  }
  return db;
}

export default { connectDB, getMainDb, getTenantDb };
