/**
 * welcome.js – Welcome & Account Verification email templates (White Theme)
 */
import { emailShell, ctaButton, ctaButtonGhost, divider, escHtml, BRAND } from './shell.js';

export function buildWelcomeEmail({ customerName, verifyLink }) {
  const firstName = customerName?.split(' ')[0] || 'there';

  const body = `
    <!-- Greeting -->
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:26px;font-weight:800;color:#000000;margin:0 0 10px;line-height:1.2;">
      Welcome to RetroStylings! ❤️
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      You're officially part of our community. Explore our curated collection of
      premium retro-street fashion and find your next favourite look.
    </p>

    <!-- Feature cards -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
      <tr>
        <td class="col-half" width="31%" style="background-color:#F9F9F9;border:1px solid #E5E5E5;
            border-radius:8px;padding:18px;text-align:center;vertical-align:top;">
          <div style="font-size:26px;margin-bottom:8px;">🛍️</div>
          <div style="font-size:13px;font-weight:600;color:#222222;margin-bottom:4px;">Exclusive Drops</div>
          <div style="font-size:11px;color:#888888;">Members-only limited editions</div>
        </td>
        <td class="col-gap" width="3%"></td>
        <td class="col-half" width="31%" style="background-color:#F9F9F9;border:1px solid #E5E5E5;
            border-radius:8px;padding:18px;text-align:center;vertical-align:top;">
          <div style="font-size:26px;margin-bottom:8px;">🚀</div>
          <div style="font-size:13px;font-weight:600;color:#222222;margin-bottom:4px;">Fast Shipping</div>
          <div style="font-size:11px;color:#888888;">Pan-India delivery 3–7 days</div>
        </td>
        <td class="col-gap" width="3%"></td>
        <td class="col-half" width="31%" style="background-color:#F9F9F9;border:1px solid #E5E5E5;
            border-radius:8px;padding:18px;text-align:center;vertical-align:top;">
          <div style="font-size:26px;margin-bottom:8px;">💫</div>
          <div style="font-size:13px;font-weight:600;color:#222222;margin-bottom:4px;">Reward Points</div>
          <div style="font-size:11px;color:#888888;">Earn on every purchase</div>
        </td>
      </tr>
    </table>

    ${ctaButton('Start Shopping →', `${BRAND.website}/shop`)}

    ${verifyLink ? `
    ${divider()}
    <div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;
                padding:16px 18px;margin-top:4px;">
      <div style="font-size:13px;font-weight:600;color:#B45309;margin-bottom:4px;">
        ✉️ Verify your email
      </div>
      <div style="font-size:12px;color:#888888;line-height:1.6;">
        Please verify your account to unlock all features.
        <a href="${verifyLink}" style="color:#000000;font-weight:600;text-decoration:underline;">
          Verify now →
        </a>
      </div>
    </div>` : ''}`;

  return emailShell({
    title:       `Welcome to RetroStylings, ${firstName}!`,
    previewText: `You're in! Welcome to RetroStylings – discover premium retro-street fashion.`,
    bodyHtml:    body,
  });
}

export function buildVerificationEmail({ customerName, otp, verifyLink }) {
  const firstName = customerName?.split(' ')[0] || 'there';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 10px;">
      Verify Your Account
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      Please verify your email address to activate your RetroStylings account
      and access all features.
    </p>

    ${otp ? `
    <!-- OTP Box -->
    <div style="background-color:#F9F9F9;border:1px solid #E5E5E5;border-radius:8px;
                padding:28px;text-align:center;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;
                  color:#888888;margin-bottom:12px;">Your Verification Code</div>
      <div style="font-size:40px;font-weight:800;letter-spacing:14px;color:#000000;
                  font-family:monospace;">${escHtml(otp)}</div>
      <div style="font-size:12px;color:#AAAAAA;margin-top:12px;">
        Expires in 10 minutes · Do not share this code
      </div>
    </div>` : ''}

    ${verifyLink ? ctaButton('✓ Verify My Email', verifyLink) : ''}

    <p style="font-size:12px;color:#AAAAAA;text-align:center;margin-top:20px;">
      If you didn't create a RetroStylings account, you can safely ignore this email.
    </p>`;

  return emailShell({
    title:       'Verify Your RetroStylings Account',
    previewText: `Your verification ${otp ? 'code' : 'link'} – verify now to get started.`,
    bodyHtml:    body,
  });
}
