/**
 * RetroStylings – Amazon SP-API Backend Proxy
 * -------------------------------------------------
 * Keeps your client_id / client_secret / refresh_token SERVER-SIDE only.
 * Exposes three REST endpoints for the React admin to call.
 *
 * Routes:
 *   GET  /api/amazon/status       – Connection health check
 *   GET  /api/amazon/orders       – Fetch last 24h orders from Amazon
 *   GET  /api/amazon/inventory    – Fetch FBA / MFN inventory
 *   POST /api/amazon/sync         – Trigger full sync (orders → Firestore)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import admin from 'firebase-admin';
import cron from 'node-cron';

// ─── Firebase Admin SDK ───────────────────────────────────────────────────────
// Place your serviceAccountKey.json in the backend/ folder
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ─── SP-API Config ────────────────────────────────────────────────────────────
const SP_API = {
  clientId:      process.env.AMAZON_CLIENT_ID,
  clientSecret:  process.env.AMAZON_CLIENT_SECRET,
  refreshToken:  process.env.AMAZON_REFRESH_TOKEN,
  marketplaceId: process.env.AMAZON_MARKETPLACE_ID || 'A21TJRUUN4KGV', // India
  sellerId:      process.env.AMAZON_SELLER_ID,
  endpoint:      'https://sellingpartnerapi-eu.amazon.com', // EU region covers India
};

// ─── Token Cache ──────────────────────────────────────────────────────────────
let tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 30_000) {
    return tokenCache.token;
  }

  const res = await axios.post('https://api.amazon.com/auth/o2/token', {
    grant_type:    'refresh_token',
    refresh_token: SP_API.refreshToken,
    client_id:     SP_API.clientId,
    client_secret: SP_API.clientSecret,
  });

  tokenCache = {
    token:     res.data.access_token,
    expiresAt: Date.now() + res.data.expires_in * 1000,
  };
  return tokenCache.token;
}

// ─── SP-API Helper ────────────────────────────────────────────────────────────
async function spRequest(method, path, params = {}) {
  const token = await getAccessToken();
  const res = await axios({
    method,
    url: `${SP_API.endpoint}${path}`,
    params,
    headers: {
      'x-amz-access-token': token,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}

// ─── Order Mapper ─────────────────────────────────────────────────────────────
function mapAmazonOrder(amazonOrder, items = []) {
  return {
    id: `AMAZON-${amazonOrder.AmazonOrderId}`,
    amazonOrderId: amazonOrder.AmazonOrderId,
    source: 'amazon',
    customerName:  amazonOrder.BuyerInfo?.BuyerName || 'Amazon Customer',
    customerEmail: amazonOrder.BuyerInfo?.BuyerEmail || '',
    total:         parseFloat(amazonOrder.OrderTotal?.Amount || 0),
    currency:      amazonOrder.OrderTotal?.CurrencyCode || 'INR',
    orderStatus:   mapAmazonStatus(amazonOrder.OrderStatus),
    paymentStatus: amazonOrder.PaymentMethodDetails ? 'paid' : 'pending',
    paymentMethod: amazonOrder.PaymentMethod || 'amazon',
    shippingAddress: {
      name:   amazonOrder.ShippingAddress?.Name || '',
      street: amazonOrder.ShippingAddress?.AddressLine1 || '',
      city:   amazonOrder.ShippingAddress?.City || '',
      state:  amazonOrder.ShippingAddress?.StateOrRegion || '',
      zip:    amazonOrder.ShippingAddress?.PostalCode || '',
      country: amazonOrder.ShippingAddress?.CountryCode || 'IN',
    },
    items: items.map(i => ({
      productId:    i.ASIN,
      name:         i.Title,
      quantity:     i.QuantityOrdered,
      price:        parseFloat(i.ItemPrice?.Amount || 0),
      sku:          i.SellerSKU,
    })),
    createdAt: admin.firestore.Timestamp.fromDate(new Date(amazonOrder.PurchaseDate)),
    updatedAt: admin.firestore.Timestamp.now(),
  };
}

function mapAmazonStatus(status) {
  const map = {
    'Pending':              'processing',
    'Unshipped':            'packed',
    'PartiallyShipped':     'shipped',
    'Shipped':              'shipped',
    'Canceled':             'cancelled',
    'InvoiceUnconfirmed':   'processing',
    'Unfulfillable':        'cancelled',
  };
  return map[status] || 'processing';
}

// ─── Sync Orders to Firestore ─────────────────────────────────────────────────
async function syncOrdersToFirestore(amazonOrders) {
  const batch = db.batch();
  let count = 0;

  for (const ao of amazonOrders) {
    // Fetch line items for each order
    let items = [];
    try {
      const itemsData = await spRequest('GET', `/orders/v0/orders/${ao.AmazonOrderId}/orderItems`, {
        MarketplaceId: SP_API.marketplaceId,
      });
      items = itemsData.payload?.OrderItems || [];
    } catch (err) {
      console.warn(`Could not fetch items for ${ao.AmazonOrderId}:`, err.message);
    }

    const mapped = mapAmazonOrder(ao, items);
    const ref = db.collection('orders').doc(mapped.id);
    batch.set(ref, mapped, { merge: true });
    count++;
  }

  await batch.commit();

  // Update last sync timestamp
  await db.collection('settings').doc('amazonSync').set({
    lastSyncAt: admin.firestore.Timestamp.now(),
    lastOrderCount: count,
  }, { merge: true });

  return count;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health / connection status
app.get('/api/amazon/status', async (req, res) => {
  try {
    await getAccessToken();
    const syncDoc = await db.collection('settings').doc('amazonSync').get();
    const syncData = syncDoc.exists ? syncDoc.data() : {};
    res.json({
      connected: true,
      lastSyncAt: syncData.lastSyncAt?.toDate().toISOString() || null,
      lastOrderCount: syncData.lastOrderCount || 0,
      marketplaceId: SP_API.marketplaceId,
      sellerId: SP_API.sellerId,
    });
  } catch (err) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Fetch last 24h orders
app.get('/api/amazon/orders', async (req, res) => {
  try {
    const createdAfter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const data = await spRequest('GET', '/orders/v0/orders', {
      MarketplaceIds: SP_API.marketplaceId,
      CreatedAfter:   createdAfter,
    });
    res.json(data.payload?.Orders || []);
  } catch (err) {
    console.error('Error fetching Amazon orders:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Fetch inventory summary
app.get('/api/amazon/inventory', async (req, res) => {
  try {
    const data = await spRequest('GET', '/fba/inventory/v1/summaries', {
      details:        true,
      granularityType: 'Marketplace',
      granularityId:   SP_API.marketplaceId,
      marketplaceIds:  SP_API.marketplaceId,
    });
    res.json(data.payload?.inventorySummaries || []);
  } catch (err) {
    console.error('Error fetching inventory:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Manual sync trigger
app.post('/api/amazon/sync', async (req, res) => {
  try {
    // Fetch last 7 days for a full manual sync
    const createdAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const data = await spRequest('GET', '/orders/v0/orders', {
      MarketplaceIds: SP_API.marketplaceId,
      CreatedAfter:   createdAfter,
    });
    const orders = data.payload?.Orders || [];
    const count = await syncOrdersToFirestore(orders);
    res.json({ success: true, syncedCount: count });
  } catch (err) {
    console.error('Sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Cron Job: Auto-sync every 15 minutes ─────────────────────────────────────
cron.schedule('*/15 * * * *', async () => {
  console.log('[CRON] Running Amazon order auto-sync...');
  try {
    const createdAfter = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // last 20 min
    const data = await spRequest('GET', '/orders/v0/orders', {
      MarketplaceIds: SP_API.marketplaceId,
      CreatedAfter:   createdAfter,
    });
    const orders = data.payload?.Orders || [];
    if (orders.length > 0) {
      const count = await syncOrdersToFirestore(orders);
      console.log(`[CRON] Synced ${count} Amazon orders.`);
    } else {
      console.log('[CRON] No new Amazon orders.');
    }
  } catch (err) {
    console.error('[CRON] Auto-sync failed:', err.message);
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ RetroStylings SP-API Proxy running on http://localhost:${PORT}`);
});
