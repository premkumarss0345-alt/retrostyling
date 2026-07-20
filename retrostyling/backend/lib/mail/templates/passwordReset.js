/**
 * passwordReset.js – Password Reset email (White Theme)
 */
import { emailShell, ctaButton, divider, escHtml, BRAND } from './shell.js';

export function buildPasswordResetEmail({ customerName, resetLink, expiresIn = '15 minutes' }) {
  const firstName = customerName?.split(' ')[0] || 'there';

  const body = `
    <p style="font-size:15px;color:#888888;margin:0 0 24px;">Hi ${escHtml(firstName)},</p>

    <h1 style="font-size:24px;font-weight:800;color:#000000;margin:0 0 10px;">
      Reset Your Password
    </h1>
    <p style="font-size:15px;color:#888888;margin:0 0 28px;line-height:1.7;">
      We received a request to reset your password. Click the button below
      to create a new one. This link will expire in
      <strong style="color:#222222;">${escHtml(expiresIn)}</strong>.
    </p>

    ${ctaButton('🔐 Reset My Password', resetLink)}

    ${divider()}

    <!-- Security notice -->
    <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;
                padding:16px 18px;margin-bottom:20px;">
      <div style="font-size:13px;font-weight:600;color:#DC2626;margin-bottom:4px;">
        ⚠️ Security Notice
      </div>
      <div style="font-size:12px;color:#888888;line-height:1.6;">
        Never share this link with anyone. RetroStylings will never ask for your password.
        If you didn't request a reset, you can safely ignore this email.
      </div>
    </div>

    <!-- Manual link -->
    <div style="background-color:#F9F9F9;border-radius:8px;border:1px solid #E5E5E5;
                padding:14px 16px;">
      <div style="font-size:11px;color:#AAAAAA;margin-bottom:6px;text-transform:uppercase;
                  letter-spacing:1px;">Or copy this link into your browser</div>
      <div style="font-size:11px;color:#888888;word-break:break-all;font-family:monospace;
                  line-height:1.5;">${resetLink}</div>
    </div>`;

  return emailShell({
    title:       'Reset Your RetroStylings Password',
    previewText: `Password reset requested – link expires in ${expiresIn}.`,
    bodyHtml:    body,
  });
}
