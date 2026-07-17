/**
 * RetroStylings – Backend Server
 * -------------------------------------------------
 * Keeps credentials SERVER-SIDE only.
 *
 * Routes:
 *   GET  /api/amazon/status       – Amazon SP-API connection health check
 *   GET  /api/amazon/orders       – Fetch last 24h orders from Amazon
 *   GET  /api/amazon/inventory    – Fetch FBA / MFN inventory
 *   POST /api/amazon/sync         – Trigger full sync (orders → Firestore)
 *
 *   POST /api/email/order-confirm     – Send order confirmation email
 *   POST /api/email/order-status      – Send order status update email
 *   GET  /api/email/test              – Send a test email (dev only)
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import admin from 'firebase-admin';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import fs from 'fs';

// ─── Firebase Admin SDK ───────────────────────────────────────────────────────
const serviceAccount = JSON.parse(
  fs.readFileSync(new URL('./serviceAccountKey.json', import.meta.url))
);

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
  marketplaceId: process.env.AMAZON_MARKETPLACE_ID || 'A21TJRUUN4KGV',
  sellerId:      process.env.AMAZON_SELLER_ID,
  endpoint:      'https://sellingpartnerapi-eu.amazon.com',
};

// ─── Nodemailer Transporter (Hostinger SMTP) ──────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.hostinger.com',
  port:   parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false', // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection at startup
transporter.verify((err) => {
  if (err) {
    console.warn('⚠️  SMTP connection failed:', err.message);
    console.warn('   Email notifications are disabled. Check SMTP credentials in .env');
  } else {
    console.log(`✅ SMTP connected via ${process.env.SMTP_HOST || 'smtp.hostinger.com'}`);
  }
});

// ─── Email Templates ──────────────────────────────────────────────────────────

const BRAND = {
  name:    'RetroStylings',
  color:   '#DFF71B',       // Primary yellow-green brand colour
  dark:    '#0a0a0a',
  accent:  '#8B5CF6',
  logo:    process.env.FRONTEND_URL
             ? `${process.env.FRONTEND_URL}/logo.png`
             : 'https://retrostylings.com/logo.png',
  website: process.env.FRONTEND_URL || 'https://retrostylings.com',
  support: 'retrostylings@gmail.com',
};

/**
 * Shared HTML shell for all emails.
 */
function emailShell({ title, previewText, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#111111;font-family:'Segoe UI',Arial,sans-serif;">
  <!-- Invisible preview text -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#111111;">
    ${previewText}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a1a 0%,#0f0f0f 100%);padding:32px 40px;border-bottom:2px solid ${BRAND.color};">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:24px;font-weight:900;color:${BRAND.color};letter-spacing:-0.5px;">
                      RETRO<span style="color:#ffffff;">STYLINGS</span>
                    </div>
                    <div style="font-size:11px;color:#666;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">
                      Standard Retro-Street Tech
                    </div>
                  </td>
                  <td align="right">
                    <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:1px;">Order Notification</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111111;padding:28px 40px;border-top:1px solid #2a2a2a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#555;line-height:1.6;">
                    You're receiving this because you placed an order on
                    <a href="${BRAND.website}" style="color:${BRAND.color};text-decoration:none;">${BRAND.website}</a>.<br/>
                    Need help? Email us at
                    <a href="mailto:${BRAND.support}" style="color:${BRAND.color};text-decoration:none;">${BRAND.support}</a>
                  </td>
                  <td align="right" style="font-size:11px;color:#444;">
                    © ${new Date().getFullYear()} ${BRAND.name}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Renders a product items table.
 */
function itemsTable(items = []) {
  if (!items || items.length === 0) return '';
  const rows = items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:14px;">
              ${item.image
                ? `<img src="${item.image}" width="56" height="72"
                        style="border-radius:8px;object-fit:cover;background:#222;display:block;" alt="${item.name}"/>`
                : `<div style="width:56px;height:72px;background:#222;border-radius:8px;"></div>`}
            </td>
            <td>
              <div style="font-size:14px;font-weight:600;color:#ffffff;margin-bottom:4px;">${item.name}</div>
              ${item.size  ? `<div style="font-size:12px;color:#888;">Size: ${item.size}</div>` : ''}
              ${item.color ? `<div style="font-size:12px;color:#888;">Color: ${item.color}</div>` : ''}
              <div style="font-size:12px;color:#888;">Qty: ${item.quantity}</div>
            </td>
          </tr>
        </table>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #2a2a2a;text-align:right;vertical-align:middle;font-weight:700;color:#ffffff;font-size:14px;">
        ₹${(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <thead>
        <tr>
          <th style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;text-align:left;padding-bottom:10px;border-bottom:1px solid #2a2a2a;">Product</th>
          <th style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;text-align:right;padding-bottom:10px;border-bottom:1px solid #2a2a2a;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

/**
 * Status badge HTML.
 */
function statusBadge(status) {
  const map = {
    processing:       { label: 'Order Confirmed',    color: '#4ADE80', bg: 'rgba(74,222,128,0.12)'  },
    packed:           { label: 'Packed',              color: '#60A5FA', bg: 'rgba(96,165,250,0.12)'  },
    shipped:          { label: 'Shipped',             color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    out_for_delivery: { label: 'Out for Delivery',   color: '#FBBF24', bg: 'rgba(251,191,36,0.12)'  },
    delivered:        { label: 'Delivered ✓',         color: '#DFF71B', bg: 'rgba(223,247,27,0.12)'  },
    cancelled:        { label: 'Cancelled',           color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
    return_approved:  { label: 'Return Approved',    color: '#FB923C', bg: 'rgba(251,146,60,0.12)'  },
    refund_completed: { label: 'Refund Completed ✓', color: '#4ADE80', bg: 'rgba(74,222,128,0.12)'  },
  };
  const s = map[status] || { label: status, color: '#aaa', bg: 'rgba(170,170,170,0.1)' };
  return `<span style="background:${s.bg};color:${s.color};border:1px solid ${s.color}33;
    border-radius:100px;padding:5px 16px;font-size:13px;font-weight:700;letter-spacing:0.5px;">
    ${s.label}
  </span>`;
}

// ─── Individual Email Builders ─────────────────────────────────────────────────

function buildOrderConfirmEmail({ orderId, customerName, items, total, shippingAddress, phone, paymentMethod }) {
  const shortId = orderId ? orderId.slice(-6).toUpperCase() : '------';
  const shipping = total > 999 ? 0 : 99;
  const subtotal = total - shipping;

  const body = `
    <div style="margin-bottom:28px;">
      <h1 style="font-size:26px;font-weight:900;color:#ffffff;margin:0 0 6px 0;">
        Thank you, ${customerName?.split(' ')[0] || 'there'}! 🎉
      </h1>
      <p style="font-size:15px;color:#888;margin:0;">
        Your order has been placed successfully. We'll start preparing it right away.
      </p>
    </div>

    <!-- Status Banner -->
    <div style="background:rgba(223,247,27,0.06);border:1px solid rgba(223,247,27,0.2);
                border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#666;margin-bottom:6px;">Order ID</div>
          <div style="font-size:22px;font-weight:900;color:#DFF71B;letter-spacing:1px;">#${shortId}</div>
        </div>
        <div>${statusBadge('processing')}</div>
      </div>
    </div>

    <!-- Order Items -->
    <div style="margin-bottom:28px;">
      <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#666;margin:0 0 4px 0;">Your Items</h3>
      ${itemsTable(items)}
    </div>

    <!-- Order Totals -->
    <div style="background:#111;border-radius:12px;padding:20px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#888;padding:4px 0;">Subtotal</td>
          <td style="font-size:13px;color:#ccc;text-align:right;padding:4px 0;">₹${subtotal.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#888;padding:4px 0;">Shipping</td>
          <td style="font-size:13px;color:${shipping === 0 ? '#4ADE80' : '#ccc'};text-align:right;padding:4px 0;">
            ${shipping === 0 ? 'FREE' : `₹${shipping}`}
          </td>
        </tr>
        <tr>
          <td style="font-size:15px;font-weight:700;color:#fff;padding:12px 0 4px 0;border-top:1px solid #2a2a2a;">Total Paid</td>
          <td style="font-size:18px;font-weight:900;color:#DFF71B;text-align:right;padding:12px 0 4px 0;border-top:1px solid #2a2a2a;">
            ₹${Number(total).toLocaleString('en-IN')}
          </td>
        </tr>
      </table>
    </div>

    <!-- Shipping & Payment -->
    <div style="display:grid;gap:16px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="48%" style="background:#111;border-radius:12px;padding:18px;vertical-align:top;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#666;margin-bottom:8px;">📦 Shipping To</div>
            <div style="font-size:13px;color:#ccc;line-height:1.6;">${shippingAddress || 'N/A'}</div>
            ${phone ? `<div style="font-size:12px;color:#777;margin-top:6px;">📱 ${phone}</div>` : ''}
          </td>
          <td width="4%"></td>
          <td width="48%" style="background:#111;border-radius:12px;padding:18px;vertical-align:top;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#666;margin-bottom:8px;">💳 Payment</div>
            <div style="font-size:13px;color:#ccc;text-transform:capitalize;">
              ${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'upi_scanner' ? 'UPI / Scanner' : paymentMethod || 'N/A'}
            </div>
            <div style="font-size:12px;color:#777;margin-top:4px;">
              ${paymentMethod === 'cod' ? 'Pay when delivered' : 'Payment received ✓'}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin-bottom:8px;">
      <a href="${BRAND.website}/profile" style="display:inline-block;background:#DFF71B;color:#000000;
        font-weight:800;font-size:14px;padding:14px 36px;border-radius:100px;text-decoration:none;
        letter-spacing:0.5px;">Track Your Order →</a>
    </div>
  `;

  return emailShell({
    title: `Order Confirmed – #${shortId} | RetroStylings`,
    previewText: `Your order #${shortId} is confirmed! We're getting it ready for you.`,
    bodyHtml: body,
  });
}

function buildStatusUpdateEmail({ orderId, customerName, status, trackingNumber, courierPartner, estimatedDelivery, items, total }) {
  const shortId = orderId ? orderId.slice(-6).toUpperCase() : '------';

  const statusMessages = {
    packed: {
      headline: 'Your order is packed! 📦',
      sub:      'Great news — your items have been carefully packed and are ready for pickup.',
      icon:     '📦',
    },
    shipped: {
      headline: 'Your order is on its way! 🚚',
      sub:      'Your package has been handed over to the courier and is now in transit.',
      icon:     '🚚',
    },
    out_for_delivery: {
      headline: 'Out for delivery today! 🛵',
      sub:      'Your order is out for delivery. Expect it at your doorstep very soon!',
      icon:     '🛵',
    },
    delivered: {
      headline: 'Delivered! Enjoy your style ✓',
      sub:      'Your order has been delivered. We hope you love your RetroStylings purchase!',
      icon:     '✅',
    },
    cancelled: {
      headline: 'Your order has been cancelled',
      sub:      'Your order has been cancelled. If you paid online, a refund will be processed within 5–7 business days.',
      icon:     '❌',
    },
    return_approved: {
      headline: 'Return request approved ✓',
      sub:      'Your return request has been approved. Please pack the items and hand them to the courier.',
      icon:     '↩️',
    },
    refund_completed: {
      headline: 'Refund completed! 💸',
      sub:      'Your refund has been processed and should reflect in your account within 3–5 business days.',
      icon:     '💸',
    },
  };

  const msg = statusMessages[status] || {
    headline: 'Order Update',
    sub:      'Your order status has been updated.',
    icon:     '📋',
  };

  const trackingBlock = (status === 'shipped' || status === 'out_for_delivery') && (trackingNumber || courierPartner) ? `
    <div style="background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.25);
                border-radius:12px;padding:20px;margin:24px 0;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#888;margin-bottom:12px;">🔍 Tracking Details</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${trackingNumber   ? `<tr><td style="font-size:12px;color:#888;padding:3px 0;">Tracking Number</td><td style="font-size:13px;color:#A78BFA;font-weight:700;text-align:right;">${trackingNumber}</td></tr>` : ''}
        ${courierPartner   ? `<tr><td style="font-size:12px;color:#888;padding:3px 0;">Courier Partner</td><td style="font-size:13px;color:#ccc;text-align:right;">${courierPartner}</td></tr>` : ''}
        ${estimatedDelivery? `<tr><td style="font-size:12px;color:#888;padding:3px 0;">Estimated Delivery</td><td style="font-size:13px;color:#4ADE80;font-weight:600;text-align:right;">${estimatedDelivery}</td></tr>` : ''}
      </table>
    </div>
  ` : '';

  const body = `
    <div style="margin-bottom:28px;">
      <div style="font-size:40px;margin-bottom:12px;">${msg.icon}</div>
      <h1 style="font-size:24px;font-weight:900;color:#ffffff;margin:0 0 8px 0;">
        ${msg.headline}
      </h1>
      <p style="font-size:14px;color:#888;margin:0;line-height:1.6;">${msg.sub}</p>
    </div>

    <!-- Status Banner -->
    <div style="background:rgba(255,255,255,0.03);border:1px solid #2a2a2a;
                border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Order</div>
            <div style="font-size:20px;font-weight:900;color:#DFF71B;">#${shortId}</div>
          </td>
          <td align="right">${statusBadge(status)}</td>
        </tr>
      </table>
    </div>

    ${trackingBlock}

    ${items && items.length > 0 ? `
      <div style="margin-bottom:24px;">
        <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#666;margin:0 0 4px 0;">Order Items</h3>
        ${itemsTable(items)}
        ${total ? `<div style="text-align:right;font-size:15px;font-weight:700;color:#DFF71B;margin-top:8px;">
          Total: ₹${Number(total).toLocaleString('en-IN')}
        </div>` : ''}
      </div>
    ` : ''}

    <!-- CTA -->
    <div style="text-align:center;margin-top:8px;">
      <a href="${BRAND.website}/profile" style="display:inline-block;background:#DFF71B;color:#000000;
        font-weight:800;font-size:14px;padding:14px 36px;border-radius:100px;text-decoration:none;">
        View Order Details →
      </a>
    </div>
  `;

  return emailShell({
    title: `${msg.headline} – #${shortId} | RetroStylings`,
    previewText: `${msg.headline} — Order #${shortId}`,
    bodyHtml: body,
  });
}

// ─── Email Sender Helper ──────────────────────────────────────────────────────

async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured — email not sent to:', to);
    return { skipped: true, reason: 'SMTP_USER or SMTP_PASS not set' };
  }

  const info = await transporter.sendMail({
    from:    `"${BRAND.name}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`📧 Email sent to ${to} → ${info.messageId}`);
  return { success: true, messageId: info.messageId };
}

// ─── Token Cache (Amazon SP-API) ──────────────────────────────────────────────
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

  await db.collection('settings').doc('amazonSync').set({
    lastSyncAt: admin.firestore.Timestamp.now(),
    lastOrderCount: count,
  }, { merge: true });

  return count;
}

// ─── Routes: Amazon SP-API ────────────────────────────────────────────────────

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

app.post('/api/amazon/sync', async (req, res) => {
  try {
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

// ─── Routes: Email Notifications ─────────────────────────────────────────────

/**
 * POST /api/email/order-confirm
 * Send order confirmation email to the customer.
 *
 * Body: { orderId, customerName, customerEmail, items, total, shippingAddress, phone, paymentMethod }
 */
app.post('/api/email/order-confirm', async (req, res) => {
  const { orderId, customerName, customerEmail, items, total, shippingAddress, phone, paymentMethod } = req.body;

  if (!customerEmail) {
    return res.status(400).json({ error: 'customerEmail is required' });
  }

  try {
    const html = buildOrderConfirmEmail({ orderId, customerName, items, total, shippingAddress, phone, paymentMethod });
    const result = await sendEmail({
      to:      customerEmail,
      subject: `✅ Order Confirmed – #${(orderId || '').slice(-6).toUpperCase()} | RetroStylings`,
      html,
    });
    res.json(result);
  } catch (err) {
    console.error('Error sending order confirm email:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/email/order-status
 * Send a status update email when admin advances order status.
 *
 * Body: { orderId, customerName, customerEmail, status, trackingNumber?, courierPartner?, estimatedDelivery?, items?, total? }
 */
app.post('/api/email/order-status', async (req, res) => {
  const {
    orderId, customerName, customerEmail, status,
    trackingNumber, courierPartner, estimatedDelivery,
    items, total,
  } = req.body;

  if (!customerEmail) {
    return res.status(400).json({ error: 'customerEmail is required' });
  }
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const STATUS_SUBJECT = {
    packed:           `📦 Order Packed – #${(orderId||'').slice(-6).toUpperCase()} | RetroStylings`,
    shipped:          `🚚 Order Shipped – #${(orderId||'').slice(-6).toUpperCase()} | RetroStylings`,
    out_for_delivery: `🛵 Out for Delivery – #${(orderId||'').slice(-6).toUpperCase()} | RetroStylings`,
    delivered:        `✅ Delivered – #${(orderId||'').slice(-6).toUpperCase()} | RetroStylings`,
    cancelled:        `❌ Order Cancelled – #${(orderId||'').slice(-6).toUpperCase()} | RetroStylings`,
    return_approved:  `↩️ Return Approved – #${(orderId||'').slice(-6).toUpperCase()} | RetroStylings`,
    refund_completed: `💸 Refund Completed – #${(orderId||'').slice(-6).toUpperCase()} | RetroStylings`,
  };

  try {
    const html = buildStatusUpdateEmail({ orderId, customerName, status, trackingNumber, courierPartner, estimatedDelivery, items, total });
    const result = await sendEmail({
      to:      customerEmail,
      subject: STATUS_SUBJECT[status] || `Order Update – #${(orderId||'').slice(-6).toUpperCase()} | RetroStylings`,
      html,
    });
    res.json(result);
  } catch (err) {
    console.error('Error sending status email:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/email/test
 * Send a test email to verify SMTP setup.
 * Usage: GET /api/email/test?to=your@email.com
 */
app.get('/api/email/test', async (req, res) => {
  const to = req.query.to || process.env.SMTP_USER;
  if (!to) return res.status(400).json({ error: 'Provide ?to=email param or set SMTP_USER in .env' });

  try {
    const html = buildOrderConfirmEmail({
      orderId:       'TEST123456',
      customerName:  'Test Customer',
      items: [
        { name: 'Retro Cargo Pants', size: 'M', color: 'Black', quantity: 1, price: 1499, image: '' },
        { name: 'Street Graphic Tee', size: 'L', color: 'White', quantity: 2, price: 699, image: '' },
      ],
      total:          2897,
      shippingAddress: '12, Anna Nagar, Chennai - 600040',
      phone:          '+91 98765 43210',
      paymentMethod:  'cod',
    });

    const result = await sendEmail({
      to,
      subject: '🧪 Test Email – RetroStylings SMTP Check',
      html,
    });
    res.json({ message: `Test email sent to ${to}`, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cron Job: Auto-sync every 15 minutes ─────────────────────────────────────
cron.schedule('*/15 * * * *', async () => {
  console.log('[CRON] Running Amazon order auto-sync...');
  try {
    const createdAfter = new Date(Date.now() - 20 * 60 * 1000).toISOString();
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
  console.log(`✅ RetroStylings Backend running on http://localhost:${PORT}`);
});
