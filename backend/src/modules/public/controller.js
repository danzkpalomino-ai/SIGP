import { getTenantDb } from '../../db.js';

export async function getProductForReception(req, res) {
  try {
    const { companyId, code } = req.params;
    if (!companyId || !code) {
      return res.status(400).json({ message: 'Faltan parametros: companyId y code' });
    }

    const db = getTenantDb(companyId);
    const Product = db.model('Product');
    const Purchase = db.model('Purchase');

    const product = await Product.findOne({
      $or: [{ codigo_barra: code }, { codigo_pos: code }],
      activo_pos: true
    }).lean();

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const pendingPurchase = await Purchase.findOne({
      'items.producto_id': product._id,
      estado: 'COMPLETADO'
    })
      .sort({ creado_en: -1 })
      .lean();

    let purchaseInfo = null;
    if (pendingPurchase) {
      const item = pendingPurchase.items.find(
        (i) => i.producto_id?.toString() === product._id.toString()
      );
      if (item) {
        purchaseInfo = {
          numero: pendingPurchase.numero,
          serie: pendingPurchase.serie,
          proveedor_nombre: pendingPurchase.proveedor_nombre,
          proveedor_ruc: pendingPurchase.proveedor_ruc,
          fecha_emision: pendingPurchase.fecha_emision,
          cantidad_pedida: item.cantidad,
          precio_unitario: item.precio_unitario,
        };
      }
    }

    res.json({
      product: {
        _id: product._id,
        descripcion: product.descripcion,
        marca: product.marca,
        categoria: product.categoria,
        codigo_pos: product.codigo_pos,
        codigo_barra: product.codigo_barra,
        precio_unitario: product.precio_unitario,
        stock_actual: product.stock_actual,
        imagen: product.imagen,
        unidad_medida: product.unidad_medida,
      },
      purchase: purchaseInfo,
    });
  } catch (err) {
    console.error('[Public] getProductForReception error:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

export async function confirmReception(req, res) {
  try {
    const { companyId, code } = req.params;
    const { cantidad_recibida, usuario } = req.body;

    if (!companyId || !code) {
      return res.status(400).json({ message: 'Faltan parametros' });
    }
    if (!cantidad_recibida || cantidad_recibida < 0) {
      return res.status(400).json({ message: 'Cantidad recibida invalida' });
    }

    const db = getTenantDb(companyId);
    const Product = db.model('Product');

    const product = await Product.findOne({
      $or: [{ codigo_barra: code }, { codigo_pos: code }],
      activo_pos: true
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const stockAnterior = product.stock_actual || 0;
    product.stock_actual = stockAnterior + Number(cantidad_recibida);
    await product.save();

    res.json({
      success: true,
      product: {
        _id: product._id,
        descripcion: product.descripcion,
        stock_anterior: stockAnterior,
        stock_nuevo: product.stock_actual,
        cantidad_recibida: Number(cantidad_recibida),
      },
      recibido_por: usuario || 'Sin identificar',
      fecha: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Public] confirmReception error:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
}

export async function getProductPublic(req, res) {
  try {
    const { companyId, code } = req.params;
    if (!companyId || !code) {
      return res.status(400).json({ message: 'Faltan parametros' });
    }

    const db = getTenantDb(companyId);
    const Product = db.model('Product');

    const product = await Product.findOne({
      $or: [{ codigo_barra: code }, { codigo_pos: code }],
      activo_pos: true
    })
      .select('descripcion marca categoria codigo_pos codigo_barra precio_unitario stock_actual imagen unidad_medida')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ product });
  } catch (err) {
    console.error('[Public] getProductPublic error:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
}
