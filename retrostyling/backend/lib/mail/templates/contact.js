/**
 * contact.js – Contact Form Auto-Reply (White Theme)
 */
import { emailShell, escHtml, BRAND } from './shell.js';

export function buildContactReplyEmail({ customerName, customerEmail, subject, message }) {
  const firstName = customerName?.split(' ')[0] || 'there';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 10px;">
      We've received your message 💬
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      Thank you for reaching out to RetroStylings. Our support team will get
      back to you within <strong style="color:#222222;">24–48 hours</strong>.
    </p>

    <!-- Message summary -->
    <div style="background-color:#F9F9F9;border:1px solid #E5E5E5;border-radius:8px;
                padding:20px 22px;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;
                  color:#888888;margin-bottom:14px;">Your Message</div>
      ${subject ? `
      <div style="font-size:12px;color:#888888;margin-bottom:4px;">Subject</div>
      <div style="font-size:14px;font-weight:600;color:#222222;margin-bottom:14px;">
        ${escHtml(subject)}
      </div>` : ''}
      <div style="font-size:12px;color:#888888;margin-bottom:6px;">Message</div>
      <div style="font-size:13px;color:#444444;line-height:1.7;
                  border-left:3px solid #000000;padding-left:14px;">
        ${escHtml(message || '').replace(/\n/g, '<br/>')}
      </div>
    </div>

    <!-- Quick links -->
    <div style="background-color:#FFFFFF;border:1px solid #E5E5E5;border-radius:8px;
                padding:18px 22px;margin-bottom:4px;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;
                  color:#888888;margin-bottom:14px;">Quick Links</div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding:5px 0;font-size:13px;">
            <a href="${BRAND.website}/track-order"
               style="color:#000000;text-decoration:none;font-weight:500;">
              📦 Track Order
            </a>
          </td>
          <td style="padding:5px 0;font-size:13px;">
            <a href="${BRAND.website}/return-policy"
               style="color:#000000;text-decoration:none;font-weight:500;">
              ↩️ Return Policy
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:5px 0;font-size:13px;">
            <a href="${BRAND.website}/shipping-info"
               style="color:#000000;text-decoration:none;font-weight:500;">
              🚚 Shipping Info
            </a>
          </td>
          <td style="padding:5px 0;font-size:13px;">
            <a href="${BRAND.website}/profile"
               style="color:#000000;text-decoration:none;font-weight:500;">
              👤 My Account
            </a>
          </td>
        </tr>
      </table>
    </div>

    <p style="font-size:12px;color:#AAAAAA;text-align:center;margin-top:20px;line-height:1.7;">
      For urgent matters, reply directly to this email.<br/>
      We're available Mon–Sat, 9AM–6PM IST.
    </p>`;

  return emailShell({
    title:       'We received your message – RetroStylings Support',
    previewText: `Thanks for reaching out, ${firstName}! We'll get back to you within 24–48 hours.`,
    bodyHtml:    body,
  });
}
