/**
 * firestoreListener.js – Automatic order status email trigger
 *
 * Listens to the Firestore `orders` collection using the Firebase Admin SDK.
 * When an order's `orderStatus` field changes, the appropriate email is sent
 * automatically without any manual API call.
 *
 * Call startOrderListener(db) once at server startup.
 */

import { sendEmail } from './mail/mailer.js';
import { buildOrderConfirmEmail }  from './mail/templates/orderConfirm.js';
import { buildPaymentSuccessEmail } from './mail/templates/payment.js';
import { buildOrderStatusEmail, getStatusSubject } from './mail/templates/orderStatus.js';
import { buildReturnRequestedEmail, buildReturnApprovedEmail, buildRefundEmail } from './mail/templates/returns.js';

// Map: orderStatus → email builder function
const STATUS_HANDLERS = {
  processing: (order) => ({
    subject: `🎉 Your Order #${order.id?.slice(-8).toUpperCase()} has been Confirmed | RetroStylings`,
    html: buildOrderConfirmEmail({
      orderId:         order.id,
      customerName:    order.customerName,
      items:           order.items || [],
      total:           order.total || 0,
      shipping:        order.shipping || 0,
      discount:        order.discount || 0,
      shippingAddress: formatAddress(order.shippingAddress),
      phone:           order.phone,
      paymentMethod:   order.paymentMethod,
      orderDate:       order.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      estimatedDelivery: order.estimatedDelivery,
    }),
    template: 'orderConfirm',
  }),

  packed: (order) => ({
    subject: getStatusSubject(order.id, 'packed'),
    html: buildOrderStatusEmail({ ...orderStatusPayload(order), status: 'packed' }),
    template: 'orderStatus_packed',
  }),

  shipped: (order) => ({
    subject: getStatusSubject(order.id, 'shipped'),
    html: buildOrderStatusEmail({ ...orderStatusPayload(order), status: 'shipped' }),
    template: 'orderStatus_shipped',
  }),

  out_for_delivery: (order) => ({
    subject: getStatusSubject(order.id, 'out_for_delivery'),
    html: buildOrderStatusEmail({ ...orderStatusPayload(order), status: 'out_for_delivery' }),
    template: 'orderStatus_outForDelivery',
  }),

  delivered: (order) => ({
    subject: getStatusSubject(order.id, 'delivered'),
    html: buildOrderStatusEmail({ ...orderStatusPayload(order), status: 'delivered' }),
    template: 'orderStatus_delivered',
  }),

  cancelled: (order) => ({
    subject: getStatusSubject(order.id, 'cancelled'),
    html: buildOrderStatusEmail({ ...orderStatusPayload(order), status: 'cancelled' }),
    template: 'orderStatus_cancelled',
  }),

  return_requested: (order) => ({
    subject: `↩️ Return Request Received – #${order.id?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnRequestedEmail({
      orderId:      order.id,
      customerName: order.customerName,
      items:        order.items || [],
      reason:       order.returnReason,
    }),
    template: 'returnRequested',
  }),

  return_approved: (order) => ({
    subject: `✅ Return Approved – #${order.id?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnApprovedEmail({
      orderId:      order.id,
      customerName: order.customerName,
      pickupDate:   order.pickupDate,
      pickupNote:   order.pickupNote,
    }),
    template: 'returnApproved',
  }),

  refund_completed: (order) => ({
    subject: `💰 Refund Processed – #${order.id?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildRefundEmail({
      orderId:      order.id,
      customerName: order.customerName,
      refundAmount: order.refundAmount || order.total || 0,
      refundMethod: order.refundMethod || 'Original payment method',
      refundNote:   order.refundNote,
    }),
    template: 'refundProcessed',
  }),
};

/**
 * Start listening to the Firestore orders collection.
 * Automatically sends emails when orderStatus changes.
 *
 * @param {FirebaseFirestore.Firestore} db  – Firebase Admin Firestore instance
 */
export function startOrderListener(db) {
  if (!db) {
    console.warn('⚠️  Firestore not available – order email listener not started.');
    return;
  }

  // Track last-known statuses to detect changes and avoid duplicate sends
  const statusCache = new Map();

  const unsubscribe = db.collection('orders').onSnapshot(
    (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        // Only act on new or modified documents
        if (change.type !== 'added' && change.type !== 'modified') return;

        const doc   = change.doc;
        const order = { id: doc.id, ...doc.data() };
        const email = order.customerEmail;
        const status = order.orderStatus;

        if (!email || !status) return;

        // For 'added' docs we always send; for 'modified' only if status changed
        if (change.type === 'modified') {
          const cachedStatus = statusCache.get(doc.id);
          if (cachedStatus === status) return; // no status change, skip
        }

        // Update cache
        statusCache.set(doc.id, status);

        // Get handler for this status
        const handler = STATUS_HANDLERS[status];
        if (!handler) {
          console.log(`[Listener] No email handler for status: ${status} (order ${doc.id})`);
          return;
        }

        // Check if we already sent this email for this order+status combo
        try {
          const existing = await db.collection('emailLogs')
            .where('orderId', '==', doc.id)
            .where('template', '==', getTemplateForStatus(status))
            .where('status', '==', 'sent')
            .limit(1)
            .get();

          if (!existing.empty) {
            console.log(`[Listener] Email already sent for ${doc.id} status=${status}, skipping.`);
            return;
          }
        } catch (checkErr) {
          console.warn('[Listener] Could not check emailLogs dedup:', checkErr.message);
        }

        // Build & send email
        try {
          const { subject, html, template } = handler(order);
          console.log(`[Listener] Sending ${template} email to ${email} for order ${doc.id}`);

          await sendEmail({ to: email, subject, html, template, orderId: doc.id, db });
        } catch (err) {
          console.error(`[Listener] Failed to send email for order ${doc.id}:`, err.message);
        }
      });
    },
    (err) => {
      console.error('[Listener] Firestore orders listener error:', err.message);
      // Auto-restart after 30s
      setTimeout(() => startOrderListener(db), 30_000);
    }
  );

  console.log('🔔 Firestore order listener active – auto-emails enabled.');
  return unsubscribe;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function orderStatusPayload(order) {
  return {
    orderId:          order.id,
    customerName:     order.customerName,
    status:           order.orderStatus,
    trackingNumber:   order.trackingNumber,
    trackingLink:     order.trackingLink,
    courierPartner:   order.courierPartner,
    estimatedDelivery: order.estimatedDelivery,
    items:            order.items || [],
    total:            order.total || 0,
  };
}

function formatAddress(addr) {
  if (!addr) return 'N/A';
  if (typeof addr === 'string') return addr;
  const { name, street, city, state, zip, country } = addr;
  return [name, street, city, state, zip, country].filter(Boolean).join(', ');
}

function getTemplateForStatus(status) {
  const map = {
    processing:       'orderConfirm',
    packed:           'orderStatus_packed',
    shipped:          'orderStatus_shipped',
    out_for_delivery: 'orderStatus_outForDelivery',
    delivered:        'orderStatus_delivered',
    cancelled:        'orderStatus_cancelled',
    return_requested: 'returnRequested',
    return_approved:  'returnApproved',
    refund_completed: 'refundProcessed',
  };
  return map[status] || status;
}
