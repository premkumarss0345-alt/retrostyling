/**
 * orderStatus.js – Order Status Update emails (White Theme)
 * Covers: Packed, Shipped, Out for Delivery, Delivered, Cancelled
 */
import {
  emailShell, ctaButton, ctaButtonGhost,
  statusBadge, itemsTable, infoRow, sectionHeading, divider, escHtml, BRAND,
} from './shell.js';

const STATUS_CONFIG = {
  packed: {
    emoji: '📦', headline: 'Your order is being packed!',
    sub: 'Great news! Our team is carefully packing your items and getting them ready for dispatch.',
    accentBg: '#EFF6FF', accentBorder: '#BFDBFE', accentText: '#1D4ED8',
    subject: '📦 Your Order is Being Packed', preview: 'Your order is packed and almost on its way!',
  },
  shipped: {
    emoji: '🚚', headline: 'Your order has been shipped!',
    sub: 'Your package has been handed over to the courier partner and is now in transit.',
    accentBg: '#F5F3FF', accentBorder: '#DDD6FE', accentText: '#7C3AED',
    subject: '🚚 Your Order Has Been Shipped', preview: 'Your order is in transit – track it now!',
  },
  out_for_delivery: {
    emoji: '🛵', headline: 'Out for delivery today!',
    sub: 'Your order is out for delivery. Expect it at your doorstep very soon!',
    accentBg: '#FFFBEB', accentBorder: '#FDE68A', accentText: '#B45309',
    subject: '🛵 Out for Delivery – Arriving Today!', preview: 'Your order is out for delivery!',
  },
  delivered: {
    emoji: '✅', headline: 'Your order has been delivered!',
    sub: 'Your RetroStylings order has been delivered. We hope you love your new style!',
    accentBg: '#F0FDF4', accentBorder: '#BBF7D0', accentText: '#15803D',
    subject: '📦 Your Order Has Been Delivered', preview: 'Your order has arrived! Enjoy your purchase.',
  },
  cancelled: {
    emoji: '❌', headline: 'Your order has been cancelled',
    sub: 'Your order has been cancelled. If you paid online, a refund will be processed within 5–7 business days.',
    accentBg: '#FEF2F2', accentBorder: '#FECACA', accentText: '#DC2626',
    subject: '❌ Your Order Has Been Cancelled', preview: 'Your order has been cancelled.',
  },
};

export function buildOrderStatusEmail(data) {
  const {
    orderId, customerName, status,
    trackingNumber, trackingLink, courierPartner, estimatedDelivery,
    items = [], total,
  } = data;

  const config    = STATUS_CONFIG[status] || STATUS_CONFIG.packed;
  const firstName = customerName?.split(' ')[0] || 'there';
  const shortId   = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';
  const trackUrl  = `${BRAND.website}/orders/${orderId}`;
  const hasTracking = (status === 'shipped' || status === 'out_for_delivery') &&
                      (trackingNumber || courierPartner);

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 8px;">
      ${config.emoji} ${config.headline}
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      ${config.sub}
    </p>

    <!-- Order banner -->
    <div style="background-color:#F9F9F9;border:1px solid #E5E5E5;border-radius:8px;
                padding:18px 22px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td>
            <div style="font-size:10px;color:#AAAAAA;text-transform:uppercase;
                        letter-spacing:1.5px;margin-bottom:4px;">Order</div>
            <div style="font-size:20px;font-weight:800;color:#000000;">${shortId}</div>
          </td>
          <td align="right" style="vertical-align:middle;">${statusBadge(status)}</td>
        </tr>
      </table>
    </div>

    ${hasTracking ? `
    <!-- Tracking info -->
    <div style="background-color:${config.accentBg};border:1px solid ${config.accentBorder};
                border-radius:8px;padding:18px 22px;margin-bottom:24px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;
                  color:${config.accentText};margin-bottom:12px;">🔍 Tracking Details</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${trackingNumber ? infoRow('Tracking Number',
          `<span style="font-family:monospace;font-weight:700;color:${config.accentText};">
            ${escHtml(trackingNumber)}</span>`
        ) : ''}
        ${courierPartner ? infoRow('Courier Partner', escHtml(courierPartner)) : ''}
        ${estimatedDelivery ? infoRow('Estimated Delivery',
          `<span style="color:#15803D;font-weight:600;">${escHtml(estimatedDelivery)}</span>`
        ) : ''}
      </table>
      ${trackingLink ? `
      <div style="margin-top:14px;text-align:center;">
        <a href="${trackingLink}"
           style="display:inline-block;background-color:#FFFFFF;color:${config.accentText};
                  border:1px solid ${config.accentBorder};font-size:12px;font-weight:600;
                  padding:9px 22px;border-radius:6px;text-decoration:none;">
          🔍 Track Shipment →
        </a>
      </div>` : ''}
    </div>` : ''}

    ${status === 'delivered' ? `
    <!-- Review nudge -->
    <div style="background-color:#F9F9F9;border:1px solid #E5E5E5;border-radius:8px;
                padding:18px 22px;margin-bottom:24px;text-align:center;">
      <div style="font-size:14px;font-weight:600;color:#222222;margin-bottom:4px;">
        Enjoying your purchase?
      </div>
      <div style="font-size:13px;color:#888888;margin-bottom:14px;">
        Share your experience and help others shop better.
      </div>
      <a href="${BRAND.website}/orders/${orderId}?rate=1"
         style="display:inline-block;background-color:#000000;color:#FFFFFF;
                font-weight:600;font-size:13px;padding:10px 24px;
                border-radius:6px;text-decoration:none;margin-right:8px;">
        ⭐ Rate Product
      </a>
      <a href="${BRAND.website}/shop"
         style="display:inline-block;background-color:#FFFFFF;color:#222222;
                border:1px solid #E5E5E5;font-weight:600;font-size:13px;
                padding:10px 20px;border-radius:6px;text-decoration:none;">
        Continue Shopping
      </a>
    </div>` : ''}

    ${items.length > 0 ? `
    ${sectionHeading('Order Items')}
    ${itemsTable(items)}
    ${total ? `<div style="text-align:right;font-size:14px;font-weight:700;color:#000000;margin-top:8px;">
      Total: ₹${Number(total).toLocaleString('en-IN')}</div>` : ''}
    ` : ''}

    ${ctaButton('📦 View Order Details →', trackUrl)}`;

  return emailShell({
    title:       `${config.subject} – ${shortId} | RetroStylings`,
    previewText: `${config.preview} Order ${shortId}.`,
    bodyHtml:    body,
  });
}

export function getStatusSubject(orderId, status) {
  const shortId = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';
  const config  = STATUS_CONFIG[status];
  return config
    ? `${config.subject} – ${shortId} | RetroStylings`
    : `Order Update – ${shortId} | RetroStylings`;
}
