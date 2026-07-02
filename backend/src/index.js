import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import authRoutes from './modules/auth/routes.js';
import configRoutes from './modules/config/routes.js';
import catalogRoutes from './modules/catalog/routes.js';
import salesRoutes from './modules/sales/routes.js';
import purchaseRoutes from './modules/purchases/routes.js';
import customerRoutes from './modules/customers/routes.js';
import cashRoutes from './modules/cash/routes.js';
import reportingRoutes from './modules/reporting/routes.js';
import syncRoutes from './modules/sync/routes.js';
import publicRoutes from './modules/public/routes.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', configRoutes);
app.use('/api/products', catalogRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/contacts', customerRoutes);
app.use('/api/cash-register', cashRoutes);
app.use('/api/reports', reportingRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SIGP', version: '0.1.0' });
});

// WebSocket para eventos en tiempo real
io.on('connection', (socket) => {
  console.log('[WS] Cliente conectado:', socket.id);
  socket.on('join-company', (companyId) => {
    socket.join(`company:${companyId}`);
  });
  socket.on('disconnect', () => {
    console.log('[WS] Cliente desconectado:', socket.id);
  });
});

export function emitEvent(companyId, event, data) {
  io.to(`company:${companyId}`).emit(event, data);
}

const PORT = process.env.PORT || 3006;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[SIGP] Servidor corriendo en puerto ${PORT}`);
  });
}).catch(err => {
  console.error('[SIGP] Error al conectar MongoDB:', err);
  process.exit(1);
});
