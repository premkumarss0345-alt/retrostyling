/**
 * newsletter.js – Newsletter Confirmation & Promotional Email (White Theme)
 */
import { emailShell, ctaButton, escHtml, BRAND } from './shell.js';

export function buildNewsletterConfirmEmail({ email, name }) {
  const firstName = name?.split(' ')[0] || 'Fashion Fan';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 10px;">
      You're Subscribed! 🎉
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      Welcome to the RetroStylings newsletter. You'll now be the first to know
      about new arrivals, exclusive offers, and subscriber-only rewards.
    </p>

    <!-- Benefits -->
    <div style="background-color:#F9F9F9;border:1px solid #E5E5E5;border-radius:8px;
                padding:22px;margin-bottom:28px;text-align:center;">
      <div style="font-size:12px;color:#888888;margin-bottom:18px;">
        What to expect in your inbox:
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="text-align:center;padding:8px;">
            <div style="font-size:26px;margin-bottom:6px;">🔥</div>
            <div style="font-size:12px;font-weight:600;color:#222222;">New Drops</div>
            <div style="font-size:11px;color:#888888;">First access</div>
          </td>
          <td style="text-align:center;padding:8px;">
            <div style="font-size:26px;margin-bottom:6px;">💸</div>
            <div style="font-size:12px;font-weight:600;color:#222222;">Exclusive Offers</div>
            <div style="font-size:11px;color:#888888;">Subscriber-only deals</div>
          </td>
          <td style="text-align:center;padding:8px;">
            <div style="font-size:26px;margin-bottom:6px;">🎁</div>
            <div style="font-size:12px;font-weight:600;color:#222222;">Rewards</div>
            <div style="font-size:11px;color:#888888;">Points & perks</div>
          </td>
        </tr>
      </table>
    </div>

    ${ctaButton('🛍️ Shop New Arrivals →', `${BRAND.website}/shop`)}

    <p style="font-size:11px;color:#AAAAAA;text-align:center;margin-top:20px;">
      You subscribed with ${escHtml(email)}.&nbsp;
      <a href="${BRAND.website}/unsubscribe?email=${encodeURIComponent(email)}"
         style="color:#AAAAAA;text-decoration:underline;">Unsubscribe</a>
    </p>`;

  return emailShell({
    title:       'Newsletter Subscription Confirmed – RetroStylings',
    previewText: `You're in! Expect exclusive drops, offers & more from RetroStylings.`,
    bodyHtml:    body,
  });
}

export function buildPromoEmail({
  recipientName, headline, subheadline,
  offerDetails, ctaText = 'Shop Now →',
  ctaUrl = `${BRAND.website}/shop`,
  couponCode, expiresAt, bannerEmoji = '🔥',
}) {
  const firstName = recipientName?.split(' ')[0] || 'there';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <!-- Promo hero banner -->
    <div style="background-color:#000000;border-radius:8px;padding:32px 24px;
                text-align:center;margin-bottom:28px;">
      <div style="font-size:40px;margin-bottom:12px;">${bannerEmoji}</div>
      <h1 style="font-size:24px;font-weight:800;color:#FFFFFF;margin:0 0 8px;
                 line-height:1.2;">${escHtml(headline)}</h1>
      ${subheadline ? `
      <p style="font-size:14px;color:#AAAAAA;margin:0;">${escHtml(subheadline)}</p>` : ''}
    </div>

    ${offerDetails ? `
    <div style="background-color:#F9F9F9;border:1px solid #E5E5E5;border-radius:8px;
                padding:18px 22px;margin-bottom:24px;font-size:14px;color:#444444;line-height:1.7;">
      ${escHtml(offerDetails).replace(/\n/g, '<br/>')}
    </div>` : ''}

    ${couponCode ? `
    <!-- Coupon code -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:11px;color:#888888;margin-bottom:10px;text-transform:uppercase;
                  letter-spacing:1.5px;">Use Code at Checkout</div>
      <div style="display:inline-block;background-color:#F9F9F9;
                  border:2px dashed #000000;border-radius:8px;
                  padding:14px 32px;font-size:26px;font-weight:800;
                  font-family:monospace;color:#000000;letter-spacing:4px;">
        ${escHtml(couponCode)}
      </div>
      ${expiresAt ? `
      <div style="font-size:12px;color:#888888;margin-top:8px;">
        ⏰ Offer expires ${escHtml(expiresAt)}
      </div>` : ''}
    </div>` : ''}

    ${ctaButton(ctaText, ctaUrl)}

    <p style="font-size:11px;color:#AAAAAA;text-align:center;margin-top:20px;">
      <a href="${BRAND.website}/unsubscribe"
         style="color:#AAAAAA;text-decoration:underline;">Unsubscribe</a>
      &nbsp;·&nbsp;This offer is exclusively for RetroStylings subscribers.
    </p>`;

  return emailShell({
    title:       `${bannerEmoji} ${headline} – RetroStylings`,
    previewText: subheadline || headline,
    bodyHtml:    body,
  });
}
