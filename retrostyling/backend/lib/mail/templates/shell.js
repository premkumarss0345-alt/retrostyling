/**
 * shell.js – Shared HTML wrapper for all RetroStylings transactional emails
 * Theme: Clean White / Professional Minimal
 *
 * Colors:
 *   Background  #FFFFFF   Card background
 *   Outer       #F5F5F5   Page background
 *   Text        #222222   Primary text
 *   Muted       #888888   Secondary text
 *   Border      #E5E5E5   Card/section borders
 *   Button      #000000   Primary CTA (black)
 *   Footer bg   #F9F9F9   Footer area
 */

const BRAND = {
  name:       'RetroStylings',
  tagline:    'Premium Fashion Store',
  color:      '#000000',
  bg:         '#FFFFFF',
  outerBg:    '#F5F5F5',
  textDark:   '#222222',
  textMuted:  '#888888',
  textLight:  '#AAAAAA',
  border:     '#E5E5E5',
  footerBg:   '#F9F9F9',
  btnBg:      '#000000',
  btnText:    '#FFFFFF',
  accentBg:   '#F5F5F5',
  website:    process.env.FRONTEND_URL   || 'https://retrostylings.in',
  support:    process.env.SMTP_USER      || 'retrostylings@retrostylings.in',
  replyTo:    process.env.EMAIL_REPLY_TO || 'retrostylings@retrostylings.in',
  social: {
    instagram: 'https://instagram.com/retrostylings',
    facebook:  'https://facebook.com/retrostylings',
    twitter:   'https://twitter.com/retrostylings',
    youtube:   'https://youtube.com/@retrostylings',
  },
};

export { BRAND };

/**
 * Full email document HTML shell.
 */
export function emailShell({ title, previewText = '', bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escHtml(title)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    body, html { margin: 0; padding: 0; width: 100% !important; }
    body { background-color: #F5F5F5 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    img { border: 0; outline: none; display: block; }
    a { color: #000000; }
    table { border-collapse: collapse; }
    @media only screen and (max-width: 620px) {
      .email-wrapper  { padding: 12px !important; }
      .email-card     { border-radius: 8px !important; }
      .email-body     { padding: 24px 20px !important; }
      .email-header   { padding: 24px 20px !important; }
      .email-footer   { padding: 20px !important; }
      .col-half       { display: block !important; width: 100% !important; }
      .col-gap        { display: none !important; }
      .cta-btn        { width: 100% !important; display: block !important; text-align: center !important; }
      .product-img    { width: 56px !important; height: 70px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#F5F5F5;line-height:1px;">
    ${escHtml(previewText)}&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;
  </div>

  <!-- Outer wrapper -->
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#F5F5F5;padding:32px 16px;">
    <tr>
      <td align="center">

        <!-- Email card -->
        <table class="email-card" width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:12px;
                      overflow:hidden;border:1px solid #E5E5E5;
                      box-shadow:0 2px 12px rgba(0,0,0,0.06);">

          <!-- ══ HEADER ══ -->
          <tr>
            <td class="email-header"
                style="background-color:#FFFFFF;padding:32px 40px;
                       border-bottom:1px solid #E5E5E5;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:middle;">
                    <!-- Logo wordmark -->
                    <div style="font-size:22px;font-weight:800;color:#000000;
                                letter-spacing:-0.5px;line-height:1;">
                      RETROSTYLINGS
                    </div>
                    <div style="font-size:11px;color:#888888;letter-spacing:2px;
                                text-transform:uppercase;margin-top:3px;font-weight:400;">
                      Premium Fashion Store
                    </div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <div style="width:40px;height:40px;background:#000000;border-radius:8px;
                                text-align:center;line-height:40px;font-size:18px;
                                font-weight:900;color:#FFFFFF;display:inline-block;">R</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ BODY ══ -->
          <tr>
            <td class="email-body" style="padding:36px 40px;background-color:#FFFFFF;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- ══ SUPPORT SECTION ══ -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background-color:#F9F9F9;border-radius:8px;
                            border:1px solid #E5E5E5;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:13px;font-weight:600;color:#222222;margin-bottom:10px;">
                      Need help?
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="font-size:12px;color:#888888;padding:3px 0;">
                          📧 Email:&nbsp;
                          <a href="mailto:${BRAND.support}"
                             style="color:#000000;text-decoration:none;font-weight:500;">
                            ${BRAND.support}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#888888;padding:3px 0;">
                          🌐 Website:&nbsp;
                          <a href="${BRAND.website}"
                             style="color:#000000;text-decoration:none;font-weight:500;">
                            ${BRAND.website}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ══ FOOTER ══ -->
          <tr>
            <td class="email-footer"
                style="background-color:#F9F9F9;padding:24px 40px;
                       border-top:1px solid #E5E5E5;">

              <!-- Thank you note -->
              <div style="font-size:13px;color:#888888;text-align:center;margin-bottom:20px;">
                Thank you for shopping with <strong style="color:#222222;">RetroStylings</strong>.
              </div>

              <!-- Social links -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="margin-bottom:20px;">
                <tr>
                  <td align="center">
                    <div style="font-size:11px;color:#AAAAAA;text-transform:uppercase;
                                letter-spacing:1.5px;margin-bottom:12px;">Follow Us</div>
                    <a href="${BRAND.social.instagram}"
                       style="display:inline-block;margin:0 4px;background:#FFFFFF;
                              border:1px solid #E5E5E5;border-radius:6px;
                              padding:7px 12px;font-size:11px;color:#222222;
                              text-decoration:none;font-weight:500;">Instagram</a>
                    <a href="${BRAND.social.facebook}"
                       style="display:inline-block;margin:0 4px;background:#FFFFFF;
                              border:1px solid #E5E5E5;border-radius:6px;
                              padding:7px 12px;font-size:11px;color:#222222;
                              text-decoration:none;font-weight:500;">Facebook</a>
                    <a href="${BRAND.social.twitter}"
                       style="display:inline-block;margin:0 4px;background:#FFFFFF;
                              border:1px solid #E5E5E5;border-radius:6px;
                              padding:7px 12px;font-size:11px;color:#222222;
                              text-decoration:none;font-weight:500;">X</a>
                    <a href="${BRAND.social.youtube}"
                       style="display:inline-block;margin:0 4px;background:#FFFFFF;
                              border:1px solid #E5E5E5;border-radius:6px;
                              padding:7px 12px;font-size:11px;color:#222222;
                              text-decoration:none;font-weight:500;">YouTube</a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #E5E5E5;margin:0 0 16px;" />

              <!-- Copyright -->
              <div style="font-size:11px;color:#AAAAAA;text-align:center;">
                © ${new Date().getFullYear()} RetroStylings. All Rights Reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Primary black CTA button */
export function ctaButton(text, url) {
  return `
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="${url}" class="cta-btn"
         style="display:inline-block;background-color:#000000;color:#FFFFFF;
                font-weight:600;font-size:14px;padding:14px 36px;
                border-radius:6px;text-decoration:none;letter-spacing:0.3px;
                mso-padding-alt:0;text-underline-color:#000000;">
        ${text}
      </a>
    </div>`;
}

/** Secondary/ghost CTA button */
export function ctaButtonGhost(text, url) {
  return `
    <div style="text-align:center;margin:10px 0;">
      <a href="${url}"
         style="display:inline-block;background-color:#FFFFFF;color:#222222;
                border:1px solid #222222;font-weight:600;font-size:13px;
                padding:12px 32px;border-radius:6px;text-decoration:none;">
        ${text}
      </a>
    </div>`;
}

/** Status badge pill – works on white background */
export function statusBadge(status) {
  const map = {
    processing:       { label: 'Order Confirmed',   color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
    packed:           { label: 'Packed',             color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
    shipped:          { label: 'Shipped',            color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    out_for_delivery: { label: 'Out for Delivery',   color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
    delivered:        { label: 'Delivered ✓',        color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
    cancelled:        { label: 'Cancelled',          color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    return_requested: { label: 'Return Requested',   color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
    return_approved:  { label: 'Return Approved',    color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
    refund_completed: { label: 'Refund Completed ✓', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
    paid:             { label: 'Payment Received ✓', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  };
  const s = map[status] || { label: status, color: '#374151', bg: '#F3F4F6', border: '#D1D5DB' };
  return `<span style="display:inline-block;background-color:${s.bg};color:${s.color};
    border:1px solid ${s.border};border-radius:100px;
    padding:4px 14px;font-size:12px;font-weight:600;letter-spacing:0.2px;">
    ${s.label}
  </span>`;
}

/** Section heading */
export function sectionHeading(text) {
  return `<div style="font-size:11px;font-weight:600;color:#888888;
    text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">${escHtml(text)}</div>`;
}

/** Horizontal divider */
export function divider() {
  return `<hr style="border:none;border-top:1px solid #E5E5E5;margin:24px 0;" />`;
}

/** Key-value info row */
export function infoRow(label, value, valueColor = '#222222') {
  return `
    <tr>
      <td style="font-size:13px;color:#888888;padding:6px 0;width:40%;vertical-align:top;">
        ${escHtml(label)}
      </td>
      <td style="font-size:13px;color:${valueColor};padding:6px 0;
                 font-weight:500;text-align:right;vertical-align:top;">
        ${value}
      </td>
    </tr>`;
}

/** Product items table */
export function itemsTable(items = []) {
  if (!items?.length) return '';

  const rows = items.map(item => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #F0F0F0;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="padding-right:16px;vertical-align:middle;">
              ${item.image
                ? `<img class="product-img" src="${item.image}" width="64" height="80"
                        style="border-radius:6px;object-fit:cover;background:#F5F5F5;
                               display:block;border:1px solid #E5E5E5;"
                        alt="${escHtml(item.name)}" />`
                : `<div class="product-img" style="width:64px;height:80px;background:#F5F5F5;
                              border-radius:6px;border:1px solid #E5E5E5;
                              display:table-cell;text-align:center;vertical-align:middle;
                              font-size:22px;">👕</div>`}
            </td>
            <td style="vertical-align:middle;">
              <div style="font-size:14px;font-weight:600;color:#222222;margin-bottom:4px;
                          line-height:1.4;">${escHtml(item.name)}</div>
              ${item.size  ? `<div style="font-size:12px;color:#888888;">Size: ${escHtml(item.size)}</div>`  : ''}
              ${item.color ? `<div style="font-size:12px;color:#888888;">Color: ${escHtml(item.color)}</div>` : ''}
              <div style="font-size:12px;color:#888888;">Qty: ${item.quantity || 1}</div>
            </td>
          </tr>
        </table>
      </td>
      <td style="padding:16px 0;border-bottom:1px solid #F0F0F0;
                 text-align:right;vertical-align:middle;">
        <div style="font-size:14px;font-weight:700;color:#222222;">
          ₹${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}
        </div>
        ${Number(item.quantity || 1) > 1
          ? `<div style="font-size:11px;color:#AAAAAA;">₹${Number(item.price||0).toLocaleString('en-IN')} each</div>`
          : ''}
      </td>
    </tr>`).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:12px 0;">
      <thead>
        <tr>
          <th style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;
                     color:#888888;text-align:left;padding-bottom:10px;
                     border-bottom:1px solid #E5E5E5;">Product</th>
          <th style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;
                     color:#888888;text-align:right;padding-bottom:10px;
                     border-bottom:1px solid #E5E5E5;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/** Order summary totals card */
export function totalsCard({ subtotal, shipping = 0, discount = 0, tax = 0, total }) {
  const freeShip = shipping === 0;
  return `
    <div style="background-color:#F9F9F9;border-radius:8px;border:1px solid #E5E5E5;
                padding:20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        ${subtotal !== undefined ? `
        <tr>
          <td style="font-size:13px;color:#888888;padding:5px 0;">Subtotal</td>
          <td style="font-size:13px;color:#222222;text-align:right;padding:5px 0;">
            ₹${Number(subtotal).toLocaleString('en-IN')}
          </td>
        </tr>` : ''}
        <tr>
          <td style="font-size:13px;color:#888888;padding:5px 0;">Shipping</td>
          <td style="font-size:13px;color:${freeShip ? '#15803D' : '#222222'};
                     text-align:right;padding:5px 0;font-weight:${freeShip ? '600' : '400'};">
            ${freeShip ? 'FREE' : `₹${Number(shipping).toLocaleString('en-IN')}`}
          </td>
        </tr>
        ${discount > 0 ? `
        <tr>
          <td style="font-size:13px;color:#888888;padding:5px 0;">Discount</td>
          <td style="font-size:13px;color:#15803D;text-align:right;padding:5px 0;font-weight:600;">
            −₹${Number(discount).toLocaleString('en-IN')}
          </td>
        </tr>` : ''}
        ${tax > 0 ? `
        <tr>
          <td style="font-size:13px;color:#888888;padding:5px 0;">Tax</td>
          <td style="font-size:13px;color:#222222;text-align:right;padding:5px 0;">
            ₹${Number(tax).toLocaleString('en-IN')}
          </td>
        </tr>` : ''}
        <tr>
          <td colspan="2">
            <div style="border-top:1px solid #E5E5E5;margin:10px 0 6px;"></div>
          </td>
        </tr>
        <tr>
          <td style="font-size:15px;font-weight:700;color:#222222;padding:4px 0;">Total</td>
          <td style="font-size:18px;font-weight:800;color:#000000;text-align:right;padding:4px 0;">
            ₹${Number(total).toLocaleString('en-IN')}
          </td>
        </tr>
      </table>
    </div>`;
}

/** Info card (gray box with label + content) */
export function infoCard(label, content) {
  return `
    <div style="background-color:#F9F9F9;border-radius:8px;border:1px solid #E5E5E5;
                padding:16px 18px;">
      <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;
                  color:#AAAAAA;margin-bottom:6px;">${escHtml(label)}</div>
      <div style="font-size:13px;color:#222222;line-height:1.6;">${content}</div>
    </div>`;
}

/** Escape HTML special chars */
export function escHtml(str) {
  if (typeof str !== 'string') return str ?? '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}
