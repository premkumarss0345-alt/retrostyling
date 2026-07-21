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
import {
  buildReturnRequestedEmail,
  buildReturnApprovedEmail,
  buildReturnRejectedEmail,
  buildReturnPickedUpEmail,
  buildReturnReceivedEmail,
  buildReturnRefundInitiatedEmail,
  buildRefundEmail,
  buildAdminReturnAlertEmail,
} from './mail/templates/returns.js';

// Map: orderStatus / returnStatus → email builder function
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
      orderId:      order.id || order.orderId,
      customerName: order.customerName,
      items:        order.items || [],
      reason:       order.returnReason || order.reason,
    }),
    template: 'returnRequested',
  }),

  pending: (order) => ({
    subject: `↩️ Return Request Received – #${(order.orderId || order.id)?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnRequestedEmail({
      orderId:      order.orderId || order.id,
      customerName: order.customerName,
      items:        order.items || [],
      reason:       order.reason || order.returnReason,
    }),
    template: 'returnRequested',
  }),

  return_approved: (order) => ({
    subject: `✅ Return Approved – #${(order.orderId || order.id)?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnApprovedEmail({
      orderId:      order.orderId || order.id,
      customerName: order.customerName,
      pickupDate:   order.pickupDate,
      pickupNote:   order.pickupNote,
    }),
    template: 'returnApproved',
  }),

  approved: (order) => ({
    subject: `✅ Return Approved – #${(order.orderId || order.id)?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnApprovedEmail({
      orderId:      order.orderId || order.id,
      customerName: order.customerName,
      pickupDate:   order.pickupDate,
      pickupNote:   order.pickupNote,
    }),
    template: 'returnApproved',
  }),

  return_rejected: (order) => ({
    subject: `❌ Return Request Update – #${(order.orderId || order.id)?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnRejectedEmail({
      orderId:         order.orderId || order.id,
      customerName:    order.customerName,
      rejectionReason: order.rejectionReason || order.reason,
      rejectionNote:   order.rejectionNote || order.note,
    }),
    template: 'returnRejected',
  }),

  rejected: (order) => ({
    subject: `❌ Return Request Update – #${(order.orderId || order.id)?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnRejectedEmail({
      orderId:         order.orderId || order.id,
      customerName:    order.customerName,
      rejectionReason: order.rejectionReason || order.reason,
      rejectionNote:   order.rejectionNote || order.note,
    }),
    template: 'returnRejected',
  }),

  pickup_scheduled: (order) => ({
    subject: `🚚 Pickup Scheduled for Return – #${(order.orderId || order.id)?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnApprovedEmail({
      orderId:      order.orderId || order.id,
      customerName: order.customerName,
      pickupDate:   order.pickupDate,
      pickupNote:   order.pickupNote || 'Pickup agent will arrive on scheduled date.',
    }),
    template: 'returnApproved',
  }),

  return_picked_up: (order) => ({
    subject: `📦 Return Item Picked Up – #${(order.orderId || order.id)?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnPickedUpEmail({
      orderId:        order.orderId || order.id,
      customerName:   order.customerName,
      courierPartner: order.courierPartner,
      trackingNumber: order.trackingNumber,
    }),
    template: 'returnPickedUp',
  }),

  return_received: (order) => ({
    subject: `🏬 Returned Product Received – #${(order.orderId || order.id)?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnReceivedEmail({
      orderId:        order.orderId || order.id,
      customerName:   order.customerName,
      inspectionNote: order.inspectionNote || order.note,
    }),
    template: 'returnReceived',
  }),

  received: (order) => ({
    subject: `🏬 Returned Product Received – #${(order.orderId || order.id)?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnReceivedEmail({
      orderId:        order.orderId || order.id,
      customerName:   order.customerName,
      inspectionNote: order.inspectionNote || order.note,
    }),
    template: 'returnReceived',
  }),

  refund_initiated: (order) => ({
    subject: `💳 Refund Initiated – #${(order.orderId || order.id)?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildReturnRefundInitiatedEmail({
      orderId:      order.orderId || order.id,
      customerName: order.customerName,
      refundAmount: order.refundAmount || order.total || 0,
      refundMethod: order.refundMethod,
      estimatedDays: '3–5 business days',
    }),
    template: 'refundInitiated',
  }),

  refund_completed: (order) => ({
    subject: `💰 Refund Processed – #${(order.orderId || order.id)?.slice(-8).toUpperCase()} | RetroStylings`,
    html: buildRefundEmail({
      orderId:      order.orderId || order.id,
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

  const statusCache = new Map();

  const unsubscribe = db.collection('orders').onSnapshot(
    (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type !== 'added' && change.type !== 'modified') return;

        const doc   = change.doc;
        const order = { id: doc.id, ...doc.data() };
        const email = order.customerEmail;
        const status = order.orderStatus;

        if (!email || !status) return;

        if (change.type === 'modified') {
          const cachedStatus = statusCache.get(doc.id);
          if (cachedStatus === status) return;
        }

        statusCache.set(doc.id, status);

        const handler = STATUS_HANDLERS[status];
        if (!handler) return;

        try {
          const existing = await db.collection('emailLogs')
            .where('orderId', '==', doc.id)
            .where('template', '==', getTemplateForStatus(status))
            .where('status', '==', 'sent')
            .limit(1)
            .get();

          if (!existing.empty) return;
        } catch (checkErr) {
          console.warn('[Listener] Could not check emailLogs dedup:', checkErr.message);
        }

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
      setTimeout(() => startOrderListener(db), 30_000);
    }
  );

  console.log('🔔 Firestore order listener active – auto-emails enabled.');
  startReturnListener(db);
  return unsubscribe;
}

/**
 * Start listening to the Firestore returns collection.
 * Automatically sends status update emails when return status changes.
 */
export function startReturnListener(db) {
  if (!db) return;

  const returnStatusCache = new Map();

  db.collection('returns').onSnapshot(
    (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type !== 'added' && change.type !== 'modified') return;

        const doc        = change.doc;
        const returnItem = { id: doc.id, ...doc.data() };
        const email      = returnItem.customerEmail;
        const status     = returnItem.status;

        if (!email || !status) return;

        if (change.type === 'modified') {
          const cachedStatus = returnStatusCache.get(doc.id);
          if (cachedStatus === status) return;
        }

        returnStatusCache.set(doc.id, status);

        // Notify Admin on new return request
        if (change.type === 'added' && (status === 'pending' || status === 'return_requested')) {
          const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
          if (adminEmail) {
            try {
              const adminHtml = buildAdminReturnAlertEmail({
                orderId: returnItem.orderId || returnItem.id,
                customerName: returnItem.customerName,
                customerEmail: email,
                productName: returnItem.productName,
                reason: returnItem.reason,
                description: returnItem.description,
              });
              await sendEmail({
                to: adminEmail,
                subject: `🚨 [Admin Alert] New Return Request – #${(returnItem.orderId || returnItem.id)?.slice(-8).toUpperCase()}`,
                html: adminHtml,
                template: 'adminReturnAlert',
                orderId: returnItem.orderId || returnItem.id,
                db,
              });
            } catch (aErr) {
              console.error('[ReturnListener] Failed to send admin return alert:', aErr.message);
            }
          }
        }

        const handler = STATUS_HANDLERS[status];
        if (!handler) return;

        const templateName = getTemplateForStatus(status);
        try {
          const existing = await db.collection('emailLogs')
            .where('orderId', '==', returnItem.orderId || doc.id)
            .where('template', '==', templateName)
            .where('status', '==', 'sent')
            .limit(1)
            .get();

          if (!existing.empty && change.type !== 'modified') return;
        } catch (checkErr) {
          console.warn('[ReturnListener] Dedup check failed:', checkErr.message);
        }

        try {
          const { subject, html, template } = handler(returnItem);
          console.log(`[ReturnListener] Sending ${template} email to ${email} for return ${doc.id}`);
          await sendEmail({ to: email, subject, html, template, orderId: returnItem.orderId || doc.id, db });
        } catch (err) {
          console.error(`[ReturnListener] Failed to send return status email:`, err.message);
        }
      });
    },
    (err) => {
      console.error('[ReturnListener] Firestore returns listener error:', err.message);
      setTimeout(() => startReturnListener(db), 30_000);
    }
  );

  console.log('🔔 Firestore returns collection listener active.');
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
    pending:          'returnRequested',
    return_approved:  'returnApproved',
    approved:         'returnApproved',
    return_rejected:  'returnRejected',
    rejected:         'returnRejected',
    pickup_scheduled: 'returnApproved',
    return_picked_up: 'returnPickedUp',
    return_received:  'returnReceived',
    received:         'returnReceived',
    refund_initiated: 'refundInitiated',
    refund_completed: 'refundProcessed',
  };
  return map[status] || status;
}

