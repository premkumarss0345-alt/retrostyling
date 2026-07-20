/**
 * orderConfirm.js – Order Confirmation email (White Theme)
 */
import {
  emailShell, ctaButton, ctaButtonGhost,
  statusBadge, itemsTable, totalsCard, infoCard,
  sectionHeading, divider, infoRow, escHtml, BRAND,
} from './shell.js';

export function buildOrderConfirmEmail(data) {
  const {
    orderId, customerName, items = [],
    total = 0,
    subtotal,
    shipping = total > 999 ? 0 : 99,
    discount = 0,
    tax = 0,
    shippingAddress,
    phone,
    paymentMethod,
    paymentStatus = 'pending',
    orderDate,
    estimatedDelivery,
  } = data;

  const firstName   = customerName?.split(' ')[0] || 'there';
  const shortId     = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';
  const displayDate = orderDate
    ? new Date(orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const paymentLabel = {
    cod: 'Cash on Delivery', upi_scanner: 'UPI / Scanner',
    upi: 'UPI Payment', card: 'Credit / Debit Card',
    netbanking: 'Net Banking', wallet: 'Wallet',
  }[paymentMethod] || paymentMethod || 'N/A';

  const trackUrl   = `${BRAND.website}/orders/${orderId}`;
  const invoiceUrl = `${BRAND.website}/orders/${orderId}?tab=invoice`;
  const isPaid     = paymentMethod !== 'cod';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 8px;">
      Your order is confirmed! 🎉
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      Thank you for shopping with RetroStylings. Your order has been placed
      successfully and is now being prepared.
    </p>

    <!-- Order info card -->
    <div style="background-color:#F9F9F9;border:1px solid #E5E5E5;border-radius:8px;
                padding:20px 22px;margin-bottom:28px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;
                  color:#AAAAAA;margin-bottom:4px;">Order ID</div>
      <div style="font-size:22px;font-weight:800;color:#000000;margin-bottom:12px;">${shortId}</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${infoRow('Order Date', displayDate)}
        ${infoRow('Status', statusBadge('processing'))}
        ${infoRow('Payment', escHtml(paymentLabel))}
        ${infoRow('Payment Status',
          isPaid
            ? '<span style="color:#15803D;font-weight:600;">✓ Paid</span>'
            : '<span style="color:#B45309;font-weight:600;">Pay on Delivery</span>'
        )}
        ${estimatedDelivery ? infoRow('Estimated Delivery',
          `<span style="color:#15803D;font-weight:600;">${escHtml(estimatedDelivery)}</span>`
        ) : ''}
      </table>
    </div>

    <!-- Product List -->
    ${sectionHeading('Order Information')}
    ${itemsTable(items)}

    <!-- Order Summary -->
    ${sectionHeading('Order Summary')}
    ${totalsCard({
      subtotal: subtotal ?? (total - shipping + discount - tax),
      shipping, discount, tax, total,
    })}

    <!-- Shipping + Payment -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="margin:20px 0 28px;">
      <tr>
        <td class="col-half" width="48%" style="vertical-align:top;">
          ${infoCard('Shipping Address',
            `${escHtml(shippingAddress || 'N/A')}${phone ? `<br/><span style="color:#888888;">📱 ${escHtml(phone)}</span>` : ''}`
          )}
        </td>
        <td class="col-gap" width="4%"></td>
        <td class="col-half" width="48%" style="vertical-align:top;">
          ${infoCard('Payment Method',
            `${escHtml(paymentLabel)}<br/><span style="color:${isPaid ? '#15803D' : '#B45309'};font-size:12px;font-weight:600;">${isPaid ? '✓ Payment received' : 'Pay when delivered'}</span>`
          )}
        </td>
      </tr>
    </table>

    <!-- CTAs -->
    ${ctaButton('📦 Track Your Order →', trackUrl)}
    ${ctaButtonGhost('🧾 Download Invoice', invoiceUrl)}`;

  return emailShell({
    title:       `Order Confirmed – ${shortId} | RetroStylings`,
    previewText: `Your order ${shortId} is confirmed! We're getting it ready for you.`,
    bodyHtml:    body,
  });
}
