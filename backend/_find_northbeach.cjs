require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();

  // Search all databases for "northbeach" or "NORTHBEACH"
  for (const dbInfo of dbs.databases) {
    if (dbInfo.name.startsWith('sicce_') || dbInfo.name.startsWith('sigp_') || dbInfo.name === 'sicce_admin') {
      const db = mongoose.connection.client.db(dbInfo.name);
      const cols = await db.listCollections().toArray();
      
      for (const col of cols) {
        try {
          const doc = await db.collection(col.name).findOne({
            $or: [
              { nombre: /northbeach/i },
              { razon_social: /northbeach/i },
              { name: /northbeach/i },
              { descripcion: /northbeach/i }
            ]
          });
          if (doc) {
            console.log(`FOUND in ${dbInfo.name}.${col.name}:`, JSON.stringify(doc).substring(0, 500));
          }
        } catch(e) { /* ignore */ }
      }
    }
  }

  // Also list all companies more thoroughly
  const mainDb = mongoose.connection.db;
  const companies = await mainDb.collection('companies').find({}).toArray();
  console.log('\n=== ALL COMPANIES (full) ===');
  for (const c of companies) {
    console.log(JSON.stringify(c, null, 2));
  }

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
