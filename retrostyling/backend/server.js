/**
 * RetroStylings – Backend Server (v2)
 * ─────────────────────────────────────────────────────────────────────────────
 * Email routes (all modular – credentials never reach the client):
 *
 *   POST /api/email/order-confirm       – Order confirmation
 *   POST /api/email/order-status        – Status update (packed / shipped …)
 *   POST /api/email/payment             – Payment success
 *   POST /api/email/welcome             – Welcome / sign-up
 *   POST /api/email/verification        – Account / OTP verification
 *   POST /api/email/password-reset      – Password reset link
 *   POST /api/email/contact             – Contact-form auto-reply
 *   POST /api/email/newsletter/confirm  – Newsletter confirmation
 *   POST /api/email/newsletter/promo    – Promotional campaign
 *   POST /api/email/return-requested    – Return request received
 *   POST /api/email/return-approved     – Return approved / pickup
 *   POST /api/email/refund              – Refund processed
 *   POST /api/email/retry/:logId        – Retry a failed email from logs
 *
 *   GET  /api/email/status              – SMTP health check
 *   GET  /api/email/test                – Send a test email (dev)
 *   GET  /api/email/logs                – List email logs (admin)
 *
 * Amazon SP-API routes (unchanged):
 *   GET  /api/amazon/status
 *   GET  /api/amazon/orders
 *   GET  /api/amazon/inventory
 *   POST /api/amazon/sync
 */

import 'dotenv/config';
import express           from 'express';
import cors              from 'cors';
import axios             from 'axios';
import admin             from 'firebase-admin';
import cron              from 'node-cron';
import fs                from 'fs';
import path              from 'path';

// ─── Mail modules ─────────────────────────────────────────────────────────────
import { sendEmail, verifySmtp }          from './lib/mail/mailer.js';
import { buildWelcomeEmail, buildVerificationEmail } from './lib/mail/templates/welcome.js';
import { buildPasswordResetEmail }        from './lib/mail/templates/passwordReset.js';
import { buildOrderConfirmEmail }         from './lib/mail/templates/orderConfirm.js';
import { buildPaymentSuccessEmail }       from './lib/mail/templates/payment.js';
import { buildOrderStatusEmail, getStatusSubject } from './lib/mail/templates/orderStatus.js';
import {
  buildReturnRequestedEmail,
  buildReturnApprovedEmail,
  buildRefundEmail,
}                                         from './lib/mail/templates/returns.js';
import { buildContactReplyEmail }         from './lib/mail/templates/contact.js';
import { buildNewsletterConfirmEmail, buildPromoEmail } from './lib/mail/templates/newsletter.js';
import { startOrderListener }             from './lib/firestoreListener.js';

// ─── Firebase Admin SDK ───────────────────────────────────────────────────────
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error('⚠️  Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', err.message);
  }
}

if (!serviceAccount) {
  try {
    serviceAccount = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'serviceAccountKey.json'), 'utf8')
    );
  } catch {
    console.warn('⚠️  No serviceAccountKey.json – some features may be limited.');
  }
}

if (serviceAccount && !admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

// ─── Express Setup ────────────────────────────────────────────────────────────
const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://retrostylings.in',
  'https://www.retrostylings.in',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
}));
app.use(express.json({ limit: '2mb' }));

// ─── Simple rate-limiter (in-memory, per IP) ─────────────────────────────────
const rateLimitStore = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQ   = 20;

function rateLimit(req, res, next) {
  const ip  = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const rec = rateLimitStore.get(ip) || { count: 0, start: now };

  if (now - rec.start > RATE_WINDOW_MS) {
    rec.count = 0;
    rec.start = now;
  }
  rec.count++;
  rateLimitStore.set(ip, rec);

  if (rec.count > RATE_MAX_REQ) {
    return res.status(429).json({ error: 'Too many requests – please try again in a minute.' });
  }
  next();
}

// ─── SP-API Config ────────────────────────────────────────────────────────────
const SP_API = {
  clientId:      process.env.AMAZON_CLIENT_ID,
  clientSecret:  process.env.AMAZON_CLIENT_SECRET,
  refreshToken:  process.env.AMAZON_REFRESH_TOKEN,
  marketplaceId: process.env.AMAZON_MARKETPLACE_ID || 'A21TJRUUN4KGV',
  sellerId:      process.env.AMAZON_SELLER_ID,
  endpoint:      'https://sellingpartnerapi-eu.amazon.com',
};

// ─── Email Service startup verification ───────────────────────────────────────
verifySmtp().then(({ connected, service, error }) => {
  if (connected) {
    if (service === 'resend') {
      console.log('✅ Email Service active: Resend HTTP API (HTTPS bypass active)');
    } else {
      console.log(`✅ Email Service active: Hostinger SMTP (${process.env.SMTP_HOST || 'smtp.hostinger.com'}:${process.env.SMTP_PORT || 465})`);
    }
  } else {
    console.warn(`⚠️  Email Service initialization failed: ${error}`);
    console.warn('   Emails will be queued/retried in Firestore but may not deliver until connection is fixed.');
  }
});

// ─── Start Firestore order listener ──────────────────────────────────────────
startOrderListener(db);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Validate required fields; return 400 if any missing */
function requireFields(res, body, fields) {
  const missing = fields.filter(f => !body[f]);
  if (missing.length) {
    res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    return false;
  }
  return true;
}

/** Standard email send + respond wrapper */
async function handleEmailRoute(res, { to, subject, html, template, orderId }) {
  try {
    const result = await sendEmail({ to, subject, html, template, orderId, db });
    if (!result.success) {
      return res.status(500).json({ error: result.error, logId: result.logId });
    }
    res.json({ success: true, messageId: result.messageId, logId: result.logId });
  } catch (err) {
    console.error(`[${template}] Error:`, err.message);
    res.status(500).json({ error: err.message });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── EMAIL ROUTES ─────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ── Welcome ───────────────────────────────────────────────────────────────────
/**
 * POST /api/email/welcome
 * Body: { customerEmail, customerName, verifyLink? }
 */
app.post('/api/email/welcome', rateLimit, async (req, res) => {
  const { customerEmail, customerName, verifyLink } = req.body;
  if (!requireFields(res, req.body, ['customerEmail', 'customerName'])) return;

  await handleEmailRoute(res, {
    to:       customerEmail,
    subject:  `❤️ Welcome to RetroStylings, ${customerName?.split(' ')[0] || 'there'}!`,
    html:     buildWelcomeEmail({ customerName, verifyLink }),
    template: 'welcome',
  });
});

// ── Account Verification ───────────────────────────────────────────────────────
/**
 * POST /api/email/verification
 * Body: { customerEmail, customerName, otp?, verifyLink? }
 */
app.post('/api/email/verification', rateLimit, async (req, res) => {
  const { customerEmail, customerName, otp, verifyLink } = req.body;
  if (!requireFields(res, req.body, ['customerEmail', 'customerName'])) return;

  await handleEmailRoute(res, {
    to:       customerEmail,
    subject:  '🔐 Verify Your RetroStylings Account',
    html:     buildVerificationEmail({ customerName, otp, verifyLink }),
    template: 'verification',
  });
});

// ── Password Reset ─────────────────────────────────────────────────────────────
/**
 * POST /api/email/password-reset
 * Body: { customerEmail, customerName, resetLink, expiresIn? }
 */
app.post('/api/email/password-reset', rateLimit, async (req, res) => {
  const { customerEmail, customerName, resetLink, expiresIn } = req.body;
  if (!requireFields(res, req.body, ['customerEmail', 'customerName', 'resetLink'])) return;

  await handleEmailRoute(res, {
    to:       customerEmail,
    subject:  '🔐 Reset Your RetroStylings Password',
    html:     buildPasswordResetEmail({ customerName, resetLink, expiresIn }),
    template: 'passwordReset',
  });
});

// ── Order Confirmation ─────────────────────────────────────────────────────────
/**
 * POST /api/email/order-confirm
 * Body: { orderId, customerName, customerEmail, items[], total, shippingAddress, phone?,
 *         paymentMethod, orderDate?, estimatedDelivery?, shipping?, discount? }
 */
app.post('/api/email/order-confirm', rateLimit, async (req, res) => {
  const { customerEmail, orderId } = req.body;
  if (!requireFields(res, req.body, ['customerEmail', 'orderId'])) return;

  const shortId = orderId?.slice(-8)?.toUpperCase();
  await handleEmailRoute(res, {
    to:       customerEmail,
    subject:  `🎉 Your Order #${shortId} has been Confirmed | RetroStylings`,
    html:     buildOrderConfirmEmail(req.body),
    template: 'orderConfirm',
    orderId,
  });
});

// ── Payment Success ────────────────────────────────────────────────────────────
/**
 * POST /api/email/payment
 * Body: { orderId, customerName, customerEmail, amount, paymentMethod, transactionId?, paymentDate? }
 */
app.post('/api/email/payment', rateLimit, async (req, res) => {
  const { customerEmail, orderId } = req.body;
  if (!requireFields(res, req.body, ['customerEmail', 'orderId', 'amount'])) return;

  const shortId = orderId?.slice(-8)?.toUpperCase();
  await handleEmailRoute(res, {
    to:       customerEmail,
    subject:  `✅ Payment Received – #${shortId} | RetroStylings`,
    html:     buildPaymentSuccessEmail(req.body),
    template: 'paymentSuccess',
    orderId,
  });
});

// ── Order Status Update ────────────────────────────────────────────────────────
/**
 * POST /api/email/order-status
 * Body: { orderId, customerName, customerEmail, status,
 *         trackingNumber?, trackingLink?, courierPartner?,
 *         estimatedDelivery?, items?, total? }
 */
app.post('/api/email/order-status', rateLimit, async (req, res) => {
  const { customerEmail, orderId, status } = req.body;
  if (!requireFields(res, req.body, ['customerEmail', 'orderId', 'status'])) return;

  await handleEmailRoute(res, {
    to:       customerEmail,
    subject:  getStatusSubject(orderId, status),
    html:     buildOrderStatusEmail(req.body),
    template: `orderStatus_${status}`,
    orderId,
  });
});

// ── Contact Form Auto-Reply ────────────────────────────────────────────────────
/**
 * POST /api/email/contact
 * Body: { customerEmail, customerName, subject?, message }
 */
app.post('/api/email/contact', rateLimit, async (req, res) => {
  const { customerEmail } = req.body;
  if (!requireFields(res, req.body, ['customerEmail', 'customerName', 'message'])) return;

  await handleEmailRoute(res, {
    to:       customerEmail,
    subject:  '💬 We received your message – RetroStylings Support',
    html:     buildContactReplyEmail(req.body),
    template: 'contactReply',
  });
});

// ── Newsletter Confirmation ────────────────────────────────────────────────────
/**
 * POST /api/email/newsletter/confirm
 * Body: { email, name? }
 */
app.post('/api/email/newsletter/confirm', rateLimit, async (req, res) => {
  const { email } = req.body;
  if (!requireFields(res, req.body, ['email'])) return;

  await handleEmailRoute(res, {
    to:       email,
    subject:  '📧 Newsletter Subscription Confirmed – RetroStylings',
    html:     buildNewsletterConfirmEmail(req.body),
    template: 'newsletterConfirm',
  });
});

// ── Promotional Campaign ───────────────────────────────────────────────────────
/**
 * POST /api/email/newsletter/promo
 * Body: { recipients[], recipientName?, headline, subheadline?,
 *         offerDetails?, ctaText?, ctaUrl?, couponCode?, expiresAt?, bannerEmoji? }
 *
 * `recipients` is an array of email addresses.
 */
app.post('/api/email/newsletter/promo', rateLimit, async (req, res) => {
  const { recipients, headline } = req.body;
  if (!requireFields(res, req.body, ['recipients', 'headline'])) return;
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'recipients must be a non-empty array' });
  }

  const results = [];
  for (const email of recipients) {
    const html = buildPromoEmail({ ...req.body, recipientName: req.body.recipientName });
    const result = await sendEmail({
      to: email, subject: `🔥 ${headline} | RetroStylings`, html,
      template: 'promo', db,
    });
    results.push({ email, ...result });
  }

  const sent   = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  res.json({ success: true, sent, failed, results });
});

// ── Return Requested ──────────────────────────────────────────────────────────
/**
 * POST /api/email/return-requested
 * Body: { orderId, customerName, customerEmail, reason?, items? }
 */
app.post('/api/email/return-requested', rateLimit, async (req, res) => {
  const { customerEmail, orderId } = req.body;
  if (!requireFields(res, req.body, ['customerEmail', 'orderId'])) return;

  const shortId = orderId?.slice(-8)?.toUpperCase();
  await handleEmailRoute(res, {
    to:       customerEmail,
    subject:  `↩️ Return Request Received – #${shortId} | RetroStylings`,
    html:     buildReturnRequestedEmail(req.body),
    template: 'returnRequested',
    orderId,
  });
});

// ── Return Approved ───────────────────────────────────────────────────────────
/**
 * POST /api/email/return-approved
 * Body: { orderId, customerName, customerEmail, pickupDate?, pickupNote? }
 */
app.post('/api/email/return-approved', rateLimit, async (req, res) => {
  const { customerEmail, orderId } = req.body;
  if (!requireFields(res, req.body, ['customerEmail', 'orderId'])) return;

  const shortId = orderId?.slice(-8)?.toUpperCase();
  await handleEmailRoute(res, {
    to:       customerEmail,
    subject:  `✅ Return Approved – #${shortId} | RetroStylings`,
    html:     buildReturnApprovedEmail(req.body),
    template: 'returnApproved',
    orderId,
  });
});

// ── Refund Processed ──────────────────────────────────────────────────────────
/**
 * POST /api/email/refund
 * Body: { orderId, customerName, customerEmail, refundAmount, refundMethod?, refundNote? }
 */
app.post('/api/email/refund', rateLimit, async (req, res) => {
  const { customerEmail, orderId } = req.body;
  if (!requireFields(res, req.body, ['customerEmail', 'orderId', 'refundAmount'])) return;

  const shortId = orderId?.slice(-8)?.toUpperCase();
  await handleEmailRoute(res, {
    to:       customerEmail,
    subject:  `💰 Refund Processed – #${shortId} | RetroStylings`,
    html:     buildRefundEmail(req.body),
    template: 'refundProcessed',
    orderId,
  });
});

// ── Retry a Failed Email ───────────────────────────────────────────────────────
/**
 * POST /api/email/retry/:logId
 * Re-fetches the email log and re-sends.
 * NOTE: The html is not stored in logs; re-use the same API endpoints for
 * proper template regeneration. This endpoint re-sends a simple notification.
 */
app.post('/api/email/retry/:logId', rateLimit, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firestore not available' });

  const { logId } = req.params;
  try {
    const logDoc = await db.collection('emailLogs').doc(logId).get();
    if (!logDoc.exists) return res.status(404).json({ error: 'Log entry not found' });

    const log = logDoc.data();
    if (log.status === 'sent') {
      return res.status(400).json({ error: 'Email already sent successfully', logId });
    }

    // Minimal retry: re-send with stored subject & a plain HTML note
    const html = `<p>This is a retry of email originally sent to ${log.to}.<br/>Subject: ${log.subject}</p>
                  <p>Please contact support at retrostylings@retrostylings.in if this is unexpected.</p>`;

    const result = await sendEmail({
      to: log.to, subject: `[Retry] ${log.subject}`,
      html, template: log.template, orderId: log.orderId, db,
    });

    // Update original log as retried
    await db.collection('emailLogs').doc(logId).update({
      retriedAt: new Date(),
      retryStatus: result.success ? 'sent' : 'failed',
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Email Logs ────────────────────────────────────────────────────────────────
/**
 * GET /api/email/logs?limit=50&status=failed&orderId=xxx
 */
app.get('/api/email/logs', rateLimit, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firestore not available' });

  try {
    const { limit: lim = 50, status, orderId } = req.query;
    let query = db.collection('emailLogs').orderBy('createdAt', 'desc');

    if (status)  query = query.where('status', '==', status);
    if (orderId) query = query.where('orderId', '==', orderId);

    query = query.limit(Number(lim));
    const snap = await query.get();
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ total: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SMTP Status ───────────────────────────────────────────────────────────────
/**
 * GET /api/email/status
 */
app.get('/api/email/status', async (req, res) => {
  const { connected, service, error } = await verifySmtp();
  const activeService = service || (process.env.RESEND_API_KEY ? 'resend' : 'smtp');
  
  const config = {
    activeService,
    resend: {
      hasApiKey: !!process.env.RESEND_API_KEY,
    },
    smtp: {
      host:   process.env.SMTP_HOST   || 'smtp.hostinger.com',
      port:   process.env.SMTP_PORT   || '465',
      secure: process.env.SMTP_SECURE !== 'false',
      user:   process.env.SMTP_USER   ? `${process.env.SMTP_USER.slice(0, 6)}***` : 'not set',
    },
    from: process.env.EMAIL_FROM || 'not set',
  };

  if (connected) {
    res.json({ connected: true, activeService, config });
  } else {
    res.status(500).json({ connected: false, error, config });
  }
});

// ── Test Email ────────────────────────────────────────────────────────────────
/**
 * GET /api/email/test?to=your@email.com&template=orderConfirm
 */
app.get('/api/email/test', async (req, res) => {
  const to       = req.query.to || process.env.SMTP_USER;
  const template = req.query.template || 'orderConfirm';

  if (!to) return res.status(400).json({ error: 'Provide ?to=email or set SMTP_USER in .env' });

  const SAMPLES = {
    orderConfirm: () => ({
      subject: '🧪 [TEST] Order Confirmed – RetroStylings',
      html:    buildOrderConfirmEmail({
        orderId: 'TEST123456789',
        customerName: 'Muneeswaran R',
        items: [
          { name: 'Retro Cargo Pants', size: 'M', color: 'Black', quantity: 1, price: 1499 },
          { name: 'Street Graphic Tee', size: 'L', color: 'White', quantity: 2, price: 699 },
        ],
        total: 2897, shipping: 0, discount: 0,
        shippingAddress: '12, Anna Nagar, Chennai – 600040, Tamil Nadu',
        phone: '+91 98765 43210',
        paymentMethod: 'upi',
        estimatedDelivery: '25–28 Jul 2026',
      }),
    }),
    welcome: () => ({
      subject: '🧪 [TEST] Welcome – RetroStylings',
      html:    buildWelcomeEmail({ customerName: 'Muneeswaran R' }),
    }),
    shipped: () => ({
      subject: '🧪 [TEST] Shipped – RetroStylings',
      html:    buildOrderStatusEmail({
        orderId: 'TEST123456789',
        customerName: 'Muneeswaran R',
        status: 'shipped',
        trackingNumber: 'DXBIND123456789',
        courierPartner: 'Delhivery',
        estimatedDelivery: '25–28 Jul 2026',
      }),
    }),
    payment: () => ({
      subject: '🧪 [TEST] Payment Received – RetroStylings',
      html:    buildPaymentSuccessEmail({
        orderId: 'TEST123456789',
        customerName: 'Muneeswaran R',
        amount: 2897,
        paymentMethod: 'upi',
        transactionId: 'UPI202607201234',
      }),
    }),
    refund: () => ({
      subject: '🧪 [TEST] Refund Processed – RetroStylings',
      html:    buildRefundEmail({
        orderId: 'TEST123456789',
        customerName: 'Muneeswaran R',
        refundAmount: 2897,
        refundMethod: 'UPI / Bank Account',
      }),
    }),
  };

  const builder = SAMPLES[template] || SAMPLES.orderConfirm;
  const { subject, html } = builder();

  try {
    const result = await sendEmail({ to, subject, html, template: `test_${template}`, db });
    res.json({ message: `Test email (${template}) sent to ${to}`, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ── AMAZON SP-API ROUTES (unchanged) ─────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

let tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 30_000) return tokenCache.token;
  const res = await axios.post('https://api.amazon.com/auth/o2/token', {
    grant_type: 'refresh_token',
    refresh_token: SP_API.refreshToken,
    client_id: SP_API.clientId,
    client_secret: SP_API.clientSecret,
  });
  tokenCache = { token: res.data.access_token, expiresAt: Date.now() + res.data.expires_in * 1000 };
  return tokenCache.token;
}

async function spRequest(method, spPath, params = {}) {
  const token = await getAccessToken();
  const response = await axios({ method, url: `${SP_API.endpoint}${spPath}`, params,
    headers: { 'x-amz-access-token': token, 'Content-Type': 'application/json' } });
  return response.data;
}

function mapAmazonStatus(status) {
  const map = {
    Pending: 'processing', Unshipped: 'packed',
    PartiallyShipped: 'shipped', Shipped: 'shipped',
    Canceled: 'cancelled', InvoiceUnconfirmed: 'processing', Unfulfillable: 'cancelled',
  };
  return map[status] || 'processing';
}

function mapAmazonOrder(amazonOrder, items = []) {
  return {
    id: `AMAZON-${amazonOrder.AmazonOrderId}`, amazonOrderId: amazonOrder.AmazonOrderId,
    source: 'amazon',
    customerName:  amazonOrder.BuyerInfo?.BuyerName || 'Amazon Customer',
    customerEmail: amazonOrder.BuyerInfo?.BuyerEmail || '',
    total:         parseFloat(amazonOrder.OrderTotal?.Amount || 0),
    currency:      amazonOrder.OrderTotal?.CurrencyCode || 'INR',
    orderStatus:   mapAmazonStatus(amazonOrder.OrderStatus),
    paymentMethod: amazonOrder.PaymentMethod || 'amazon',
    shippingAddress: {
      name:    amazonOrder.ShippingAddress?.Name || '',
      street:  amazonOrder.ShippingAddress?.AddressLine1 || '',
      city:    amazonOrder.ShippingAddress?.City || '',
      state:   amazonOrder.ShippingAddress?.StateOrRegion || '',
      zip:     amazonOrder.ShippingAddress?.PostalCode || '',
      country: amazonOrder.ShippingAddress?.CountryCode || 'IN',
    },
    items: items.map(i => ({
      productId: i.ASIN, name: i.Title,
      quantity: i.QuantityOrdered, price: parseFloat(i.ItemPrice?.Amount || 0), sku: i.SellerSKU,
    })),
    createdAt: admin.firestore.Timestamp.fromDate(new Date(amazonOrder.PurchaseDate)),
    updatedAt: admin.firestore.Timestamp.now(),
  };
}

async function syncOrdersToFirestore(amazonOrders) {
  if (!db) return 0;
  const batch = db.batch();
  let count = 0;
  for (const ao of amazonOrders) {
    let items = [];
    try {
      const d = await spRequest('GET', `/orders/v0/orders/${ao.AmazonOrderId}/orderItems`,
        { MarketplaceId: SP_API.marketplaceId });
      items = d.payload?.OrderItems || [];
    } catch (e) { console.warn(`Could not fetch items for ${ao.AmazonOrderId}:`, e.message); }
    const mapped = mapAmazonOrder(ao, items);
    batch.set(db.collection('orders').doc(mapped.id), mapped, { merge: true });
    count++;
  }
  await batch.commit();
  if (db) await db.collection('settings').doc('amazonSync').set(
    { lastSyncAt: admin.firestore.Timestamp.now(), lastOrderCount: count }, { merge: true });
  return count;
}

app.get('/api/amazon/status', async (req, res) => {
  try {
    await getAccessToken();
    const syncDoc  = db ? await db.collection('settings').doc('amazonSync').get() : null;
    const syncData = syncDoc?.exists ? syncDoc.data() : {};
    res.json({ connected: true, lastSyncAt: syncData.lastSyncAt?.toDate()?.toISOString() || null,
      lastOrderCount: syncData.lastOrderCount || 0, marketplaceId: SP_API.marketplaceId });
  } catch (err) { res.status(500).json({ connected: false, error: err.message }); }
});

app.get('/api/amazon/orders', async (req, res) => {
  try {
    const createdAfter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const data = await spRequest('GET', '/orders/v0/orders',
      { MarketplaceIds: SP_API.marketplaceId, CreatedAfter: createdAfter });
    res.json(data.payload?.Orders || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/amazon/inventory', async (req, res) => {
  try {
    const data = await spRequest('GET', '/fba/inventory/v1/summaries', {
      details: true, granularityType: 'Marketplace',
      granularityId: SP_API.marketplaceId, marketplaceIds: SP_API.marketplaceId,
    });
    res.json(data.payload?.inventorySummaries || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/amazon/sync', async (req, res) => {
  try {
    const createdAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const data = await spRequest('GET', '/orders/v0/orders',
      { MarketplaceIds: SP_API.marketplaceId, CreatedAfter: createdAfter });
    const count = await syncOrdersToFirestore(data.payload?.Orders || []);
    res.json({ success: true, syncedCount: count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Cron: Amazon auto-sync every 15 minutes ──────────────────────────────────
cron.schedule('*/15 * * * *', async () => {
  console.log('[CRON] Running Amazon order auto-sync…');
  try {
    const createdAfter = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const data = await spRequest('GET', '/orders/v0/orders',
      { MarketplaceIds: SP_API.marketplaceId, CreatedAfter: createdAfter });
    const orders = data.payload?.Orders || [];
    if (orders.length > 0) {
      const count = await syncOrdersToFirestore(orders);
      console.log(`[CRON] Synced ${count} Amazon orders.`);
    } else {
      console.log('[CRON] No new Amazon orders.');
    }
  } catch (err) { console.error('[CRON] Auto-sync failed:', err.message); }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ RetroStylings Backend  →  http://localhost:${PORT}`);
  console.log(`   Email sender: ${process.env.EMAIL_FROM || 'RetroStylings <retrostylings@retrostylings.in>'}`);
  console.log(`   Environment:  ${process.env.NODE_ENV || 'development'}\n`);
});
