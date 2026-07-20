/**
 * payment.js – Payment Success email (White Theme)
 */
import { emailShell, ctaButton, ctaButtonGhost, statusBadge, infoRow, divider, escHtml, BRAND } from './shell.js';

export function buildPaymentSuccessEmail({
  orderId, customerName, amount, paymentMethod,
  transactionId, paymentDate,
}) {
  const firstName   = customerName?.split(' ')[0] || 'there';
  const shortId     = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';
  const displayDate = paymentDate
    ? new Date(paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const paymentLabel = {
    cod: 'Cash on Delivery', upi_scanner: 'UPI / Scanner',
    upi: 'UPI Payment', card: 'Credit / Debit Card',
    netbanking: 'Net Banking', wallet: 'Wallet',
  }[paymentMethod] || paymentMethod || 'Online Payment';

  const trackUrl   = `${BRAND.website}/orders/${orderId}`;
  const invoiceUrl = `${BRAND.website}/orders/${orderId}?tab=invoice`;

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 10px;">
      Payment Received Successfully ✅
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      Your payment has been confirmed. Thank you for your purchase!
      Here's a summary of your transaction.
    </p>

    <!-- Payment summary card -->
    <div style="background-color:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;
                padding:22px 24px;margin-bottom:28px;">
      <div style="text-align:center;margin-bottom:18px;">
        ${statusBadge('paid')}
      </div>
      <!-- Amount -->
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:11px;color:#888888;text-transform:uppercase;
                    letter-spacing:1.5px;margin-bottom:6px;">Amount Paid</div>
        <div style="font-size:32px;font-weight:800;color:#000000;">
          ₹${Number(amount).toLocaleString('en-IN')}
        </div>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${infoRow('Payment Method', escHtml(paymentLabel))}
        ${transactionId ? infoRow('Transaction ID',
          `<span style="font-family:monospace;font-size:12px;">${escHtml(transactionId)}</span>`
        ) : ''}
        ${infoRow('Order ID', `<strong>${shortId}</strong>`)}
        ${infoRow('Date', displayDate)}
      </table>
    </div>

    <!-- CTAs -->
    ${ctaButton('📦 Track Your Order →', trackUrl)}
    ${ctaButtonGhost('🧾 Download Invoice', invoiceUrl)}

    <p style="font-size:12px;color:#AAAAAA;text-align:center;margin-top:20px;">
      Keep this email as your payment receipt.
    </p>`;

  return emailShell({
    title:       `Payment Received – ${shortId} | RetroStylings`,
    previewText: `Payment of ₹${Number(amount).toLocaleString('en-IN')} confirmed for order ${shortId}.`,
    bodyHtml:    body,
  });
}
