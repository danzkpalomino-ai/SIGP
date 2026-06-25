import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import productRoutes from './routes/products.js';
import saleRoutes from './routes/sales.js';
import purchaseRoutes from './routes/purchases.js';
import contactRoutes from './routes/contacts.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/contacts', contactRoutes);

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
