import { productSchema } from './Product.js';
import { saleSchema } from './Sale.js';
import { purchaseSchema } from './Purchase.js';
import { contactSchema } from './Contact.js';
import { shiftSchema } from './CashRegister.js';
import { puntoVentaSchema } from './PuntoVenta.js';

export function registerModels(db) {
  db.model('Product', productSchema);
  db.model('Sale', saleSchema);
  db.model('Purchase', purchaseSchema);
  db.model('Contact', contactSchema);
  db.model('Shift', shiftSchema);
  db.model('PuntoVenta', puntoVentaSchema);
}
