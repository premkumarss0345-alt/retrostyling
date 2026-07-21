/**
 * returns.js – Return & Refund email templates (White Theme)
 */
import { emailShell, ctaButton, statusBadge, infoRow, divider, escHtml, BRAND } from './shell.js';

export function buildReturnRequestedEmail({ orderId, customerName, items = [], reason }) {
  const firstName = customerName?.split(' ')[0] || 'there';
  const shortId   = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 8px;">
      Return Request Received ↩️
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      We've received your return request for order ${shortId}.
      Our team will review it within <strong style="color:#222222;">24–48 hours</strong>.
    </p>

    <!-- Order + reason card -->
    <div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;
                padding:20px 22px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td>
            <div style="font-size:10px;color:#B45309;text-transform:uppercase;
                        letter-spacing:1.5px;margin-bottom:4px;">Order</div>
            <div style="font-size:20px;font-weight:800;color:#000000;">${shortId}</div>
          </td>
          <td align="right" style="vertical-align:middle;">${statusBadge('return_requested')}</td>
        </tr>
      </table>
      ${reason ? `
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid #FDE68A;">
        <div style="font-size:11px;color:#B45309;margin-bottom:4px;text-transform:uppercase;
                    letter-spacing:1px;">Return Reason</div>
        <div style="font-size:13px;color:#222222;">${escHtml(reason)}</div>
      </div>` : ''}
    </div>

    <!-- Steps -->
    <div style="background-color:#F9F9F9;border:1px solid #E5E5E5;border-radius:8px;
                padding:20px 22px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;
                  color:#888888;margin-bottom:16px;">What Happens Next</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding:6px 0;vertical-align:top;width:28px;">
            <div style="width:22px;height:22px;background-color:#000000;border-radius:50%;
                        text-align:center;line-height:22px;font-size:11px;font-weight:700;
                        color:#FFFFFF;">1</div>
          </td>
          <td style="padding:6px 0;font-size:13px;color:#888888;">
            Our team reviews your request <span style="color:#222222;">(24–48 hrs)</span>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;vertical-align:top;width:28px;">
            <div style="width:22px;height:22px;background-color:#000000;border-radius:50%;
                        text-align:center;line-height:22px;font-size:11px;font-weight:700;
                        color:#FFFFFF;">2</div>
          </td>
          <td style="padding:6px 0;font-size:13px;color:#888888;">
            You'll receive a <span style="color:#222222;">Return Approved</span> email with pickup details
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;vertical-align:top;width:28px;">
            <div style="width:22px;height:22px;background-color:#000000;border-radius:50%;
                        text-align:center;line-height:22px;font-size:11px;font-weight:700;
                        color:#FFFFFF;">3</div>
          </td>
          <td style="padding:6px 0;font-size:13px;color:#888888;">
            Refund processed <span style="color:#222222;">within 5–7 business days</span> after pickup
          </td>
        </tr>
      </table>
    </div>

    ${ctaButton('📦 View Order →', `${BRAND.website}/orders/${orderId}`)}`;

  return emailShell({
    title:       `Return Request Received – ${shortId} | RetroStylings`,
    previewText: `Your return request for order ${shortId} is received. We'll review it shortly.`,
    bodyHtml:    body,
  });
}

export function buildReturnApprovedEmail({ orderId, customerName, pickupDate, pickupNote }) {
  const firstName = customerName?.split(' ')[0] || 'there';
  const shortId   = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 8px;">
      Return Request Approved ✅
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      Your return request for order ${shortId} has been approved.
      Please keep the items ready for pickup.
    </p>

    <!-- Approval card -->
    <div style="background-color:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;
                padding:20px 22px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td>
            <div style="font-size:10px;color:#15803D;text-transform:uppercase;
                        letter-spacing:1.5px;margin-bottom:4px;">Order</div>
            <div style="font-size:20px;font-weight:800;color:#000000;">${shortId}</div>
          </td>
          <td align="right" style="vertical-align:middle;">${statusBadge('return_approved')}</td>
        </tr>
      </table>
      ${pickupDate ? `
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid #BBF7D0;">
        <div style="font-size:11px;color:#15803D;margin-bottom:4px;text-transform:uppercase;
                    letter-spacing:1px;">📅 Pickup Date</div>
        <div style="font-size:16px;font-weight:700;color:#000000;">${escHtml(pickupDate)}</div>
      </div>` : ''}
      ${pickupNote ? `<div style="margin-top:8px;font-size:12px;color:#888888;">${escHtml(pickupNote)}</div>` : ''}
    </div>

    <!-- Packing instructions -->
    <div style="background-color:#F9F9F9;border:1px solid #E5E5E5;border-radius:8px;
                padding:16px 20px;margin-bottom:24px;">
      <div style="font-size:13px;color:#888888;line-height:1.9;">
        📦 Pack items securely in the original packaging if possible.<br/>
        🏷️ Keep the tags intact and include all accessories.<br/>
        📞 Our courier partner will contact you before pickup.
      </div>
    </div>

    ${ctaButton('View Return Status →', `${BRAND.website}/orders/${orderId}`)}`;

  return emailShell({
    title:       `Return Approved – ${shortId} | RetroStylings`,
    previewText: `Your return for ${shortId} is approved. Keep items ready for pickup.`,
    bodyHtml:    body,
  });
}

export function buildRefundEmail({ orderId, customerName, refundAmount, refundMethod, refundNote }) {
  const firstName = customerName?.split(' ')[0] || 'there';
  const shortId   = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 8px;">
      Refund Processed Successfully 💰
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      Your refund for order ${shortId} has been processed successfully.
    </p>

    <!-- Refund card -->
    <div style="background-color:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;
                padding:24px;margin-bottom:28px;">
      <div style="text-align:center;margin-bottom:18px;">
        ${statusBadge('refund_completed')}
      </div>
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:11px;color:#888888;text-transform:uppercase;
                    letter-spacing:1.5px;margin-bottom:6px;">Refund Amount</div>
        <div style="font-size:32px;font-weight:800;color:#15803D;">
          ₹${Number(refundAmount || 0).toLocaleString('en-IN')}
        </div>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${refundMethod ? infoRow('Refund To', escHtml(refundMethod)) : ''}
        ${infoRow('Order', `<strong>${shortId}</strong>`)}
      </table>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid #BBF7D0;
                  font-size:12px;color:#888888;">
        ⏱️ Refunds typically reflect in your account within 3–5 business days.
      </div>
      ${refundNote ? `<div style="margin-top:6px;font-size:12px;color:#888888;">${escHtml(refundNote)}</div>` : ''}
    </div>

    ${ctaButton('🛍️ Continue Shopping →', `${BRAND.website}/shop`)}`;

  return emailShell({
    title:       `Refund Processed – ${shortId} | RetroStylings`,
    previewText: `Your refund of ₹${Number(refundAmount||0).toLocaleString('en-IN')} for ${shortId} has been processed.`,
    bodyHtml:    body,
  });
}

export function buildReturnRejectedEmail({ orderId, customerName, rejectionReason, rejectionNote }) {
  const firstName = customerName?.split(' ')[0] || 'there';
  const shortId   = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 8px;">
      Return Request Update ❌
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      We reviewed your return request for order ${shortId}. Unfortunately, we are unable to accept this return request based on our return policy guidelines.
    </p>

    <!-- Rejection card -->
    <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:20px 22px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td>
            <div style="font-size:10px;color:#DC2626;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Order</div>
            <div style="font-size:20px;font-weight:800;color:#000000;">${shortId}</div>
          </td>
          <td align="right" style="vertical-align:middle;">${statusBadge('return_rejected')}</td>
        </tr>
      </table>
      ${rejectionReason ? `
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid #FECACA;">
        <div style="font-size:11px;color:#DC2626;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Reason</div>
        <div style="font-size:14px;font-weight:600;color:#222222;">${escHtml(rejectionReason)}</div>
      </div>` : ''}
      ${rejectionNote ? `
      <div style="margin-top:8px;font-size:13px;color:#555555;line-height:1.6;">
        ${escHtml(rejectionNote)}
      </div>` : ''}
    </div>

    <p style="font-size:14px;color:#666666;line-height:1.6;margin-bottom:24px;">
      If you believe this was a mistake or have additional information to provide, please contact our support team at <a href="mailto:support@retrostylings.in" style="color:#000;font-weight:600;">support@retrostylings.in</a>.
    </p>

    ${ctaButton('💬 Contact Support →', `${BRAND.website}/contact`)}`;

  return emailShell({
    title:       `Return Request Update – ${shortId} | RetroStylings`,
    previewText: `Update regarding your return request for ${shortId}.`,
    bodyHtml:    body,
  });
}

export function buildReturnPickedUpEmail({ orderId, customerName, courierPartner, trackingNumber }) {
  const firstName = customerName?.split(' ')[0] || 'there';
  const shortId   = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 8px;">
      Return Product Picked Up 📦
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      Your return package for order ${shortId} has been picked up by ${escHtml(courierPartner || 'our courier partner')} and is on its way to our fulfillment center.
    </p>

    <div style="background-color:#F5F3FF;border:1px solid #DDD6FE;border-radius:8px;padding:20px 22px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td>
            <div style="font-size:10px;color:#7C3AED;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Order</div>
            <div style="font-size:20px;font-weight:800;color:#000000;">${shortId}</div>
          </td>
          <td align="right" style="vertical-align:middle;">${statusBadge('return_picked_up')}</td>
        </tr>
      </table>
      ${trackingNumber ? `
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid #DDD6FE;">
        <div style="font-size:11px;color:#7C3AED;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Tracking Number</div>
        <div style="font-size:16px;font-weight:700;color:#000000;">${escHtml(trackingNumber)}</div>
      </div>` : ''}
    </div>

    ${ctaButton('📦 Track Return →', `${BRAND.website}/orders/${orderId}`)}`;

  return emailShell({
    title:       `Return Picked Up – ${shortId} | RetroStylings`,
    previewText: `Your return item for order ${shortId} has been picked up.`,
    bodyHtml:    body,
  });
}

export function buildReturnReceivedEmail({ orderId, customerName, inspectionNote }) {
  const firstName = customerName?.split(' ')[0] || 'there';
  const shortId   = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 8px;">
      Returned Product Received 🏬
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      We have received your returned item for order ${shortId} at our warehouse. Our team is conducting a quick quality check before releasing your refund.
    </p>

    <div style="background-color:#F5F3FF;border:1px solid #DDD6FE;border-radius:8px;padding:20px 22px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td>
            <div style="font-size:10px;color:#6D28D9;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Order</div>
            <div style="font-size:20px;font-weight:800;color:#000000;">${shortId}</div>
          </td>
          <td align="right" style="vertical-align:middle;">${statusBadge('return_received')}</td>
        </tr>
      </table>
      ${inspectionNote ? `
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid #DDD6FE;font-size:13px;color:#333;">
        ${escHtml(inspectionNote)}
      </div>` : ''}
    </div>

    ${ctaButton('View Order →', `${BRAND.website}/orders/${orderId}`)}`;

  return emailShell({
    title:       `Returned Item Received – ${shortId} | RetroStylings`,
    previewText: `We received your returned product for ${shortId} and quality check is in progress.`,
    bodyHtml:    body,
  });
}

export function buildReturnRefundInitiatedEmail({ orderId, customerName, refundAmount, refundMethod, estimatedDays }) {
  const firstName = customerName?.split(' ')[0] || 'there';
  const shortId   = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 8px;">
      Refund Initiated 💳
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      Great news! Quality check passed and your refund for order ${shortId} has been initiated.
    </p>

    <div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:20px 22px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td>
            <div style="font-size:10px;color:#B45309;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Refund Amount</div>
            <div style="font-size:26px;font-weight:800;color:#B45309;">₹${Number(refundAmount || 0).toLocaleString('en-IN')}</div>
          </td>
          <td align="right" style="vertical-align:middle;">${statusBadge('refund_initiated')}</td>
        </tr>
      </table>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid #FDE68A;font-size:13px;color:#444;">
        💳 Mode: <strong>${escHtml(refundMethod || 'Original Payment Method')}</strong><br/>
        ⏱️ Estimated processing time: <strong>${escHtml(estimatedDays || '3–5 business days')}</strong>
      </div>
    </div>

    ${ctaButton('🛍️ View Store →', `${BRAND.website}/shop`)}`;

  return emailShell({
    title:       `Refund Initiated – ${shortId} | RetroStylings`,
    previewText: `Refund of ₹${Number(refundAmount||0).toLocaleString('en-IN')} for ${shortId} has been initiated.`,
    bodyHtml:    body,
  });
}

export function buildAdminReturnAlertEmail({ orderId, customerName, customerEmail, productName, reason, description }) {
  const shortId = orderId ? `#${orderId.slice(-8).toUpperCase()}` : '#------';

  const body = `
    <h1 style="font-size:22px;font-weight:800;color:#000000;margin:0 0 8px;">
      🚨 New Return Request Received
    </h1>
    <p style="font-size:14px;color:#666666;margin:0 0 20px;">
      A customer has submitted a return request. Details are below:
    </p>

    <div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:18px 20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:13px;color:#333;">
        ${infoRow('Order ID', `<strong>${shortId}</strong>`)}
        ${infoRow('Customer', `${escHtml(customerName || 'N/A')} (${escHtml(customerEmail || 'N/A')})`)}
        ${productName ? infoRow('Product', escHtml(productName)) : ''}
        ${reason ? infoRow('Reason', `<strong>${escHtml(reason)}</strong>`) : ''}
      </table>
      ${description ? `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #FDE68A;font-size:13px;color:#555;">
        <strong>Description:</strong> ${escHtml(description)}
      </div>` : ''}
    </div>

    ${ctaButton('🛠️ Manage Return in Admin Panel →', `${BRAND.website}/admin/returns`)}`;

  return emailShell({
    title:       `[Admin Alert] Return Requested – ${shortId}`,
    previewText: `New return request received for order ${shortId}`,
    bodyHtml:    body,
  });
}

