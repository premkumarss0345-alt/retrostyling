/**
 * mailer.js – Core email service for RetroStylings
 *
 * Provides:
 *  - Dual mail transports:
 *    1. Resend HTTP API (via HTTPS port 443, bypasses hosting port blocks)
 *    2. Nodemailer SMTP (fallback for local development/unblocked hosts)
 *  - sendEmail()   – sends mail with auto-retry (up to 3 attempts) + Firestore logging
 *  - verifySmtp()  – tests mailer connectivity with a timeout
 */

import nodemailer from 'nodemailer';
import axios      from 'axios';

// ─── Transporter (SMTP) ────────────────────────────────────────────────────────

let _transporter = null;

export function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.hostinger.com',
      port:   Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false', // true for port 465 SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10_000,
      greetingTimeout:   10_000,
      socketTimeout:     30_000,
    });
  }
  return _transporter;
}

// ─── Email Sender with Retry ───────────────────────────────────────────────────

const MAX_RETRIES    = 3;
const RETRY_BASE_MS  = 1_000;

/**
 * Send an email with auto-retry and Firestore logging.
 * Supports Resend API (HTTPS) and Nodemailer (SMTP).
 *
 * @param {object}  opts
 * @param {string}  opts.to          – Recipient email address
 * @param {string}  opts.subject     – Email subject line
 * @param {string}  opts.html        – HTML body
 * @param {string}  [opts.template]  – Template name for logging
 * @param {string}  [opts.orderId]   – Associated order ID for logging
 * @param {object}  [opts.db]        – Firebase Admin Firestore instance (optional)
 * @returns {Promise<{success:boolean, messageId?:string, logId?:string, error?:string}>}
 */
export async function sendEmail({ to, subject, html, template = 'unknown', orderId, db }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const useResend    = !!resendApiKey;

  const from         = process.env.EMAIL_FROM || '"RetroStylings" <retrostylings@retrostylings.in>';
  const replyTo      = process.env.EMAIL_REPLY_TO || 'retrostylings@retrostylings.in';

  if (!useResend && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
    console.warn('⚠️  Neither RESEND_API_KEY nor SMTP credentials configured – email skipped for:', to);
    return { success: false, error: 'Credentials not configured' };
  }

  let lastError;
  let messageId;

  // ── Retry loop ──────────────────────────────────────────────────────────────
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (useResend) {
        // Send via Resend HTTPS API (never blocked by Render)
        const response = await axios.post(
          'https://api.resend.com/emails',
          {
            from,
            to: [to],
            reply_to: replyTo,
            subject,
            html,
          },
          {
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type':  'application/json',
            },
            timeout: 10_000,
          }
        );
        messageId = response.data?.id;
        console.log(`📧 [attempt ${attempt}/${MAX_RETRIES}] Email sent via Resend API → ${to} | ${subject} | id:${messageId}`);
      } else {
        // Send via standard SMTP
        const transporter = getTransporter();
        const info = await transporter.sendMail({ from, replyTo, to, subject, html });
        messageId  = info.messageId;
        console.log(`📧 [attempt ${attempt}/${MAX_RETRIES}] Email sent via SMTP → ${to} | ${subject} | id:${messageId}`);
      }
      break; // Success – exit retry loop
    } catch (err) {
      // Extract clean error message
      const errorMsg = err.response?.data?.message || err.message;
      lastError = new Error(errorMsg);
      console.error(`❌ [attempt ${attempt}/${MAX_RETRIES}] Email failed (${useResend ? 'Resend' : 'SMTP'}) → ${to} | ${errorMsg}`);

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        console.log(`   ⏳ Retrying in ${delay}ms…`);
        await sleep(delay);
      }
    }
  }

  // ── Log to Firestore (if db is provided) ───────────────────────────────────
  const succeeded = !!messageId;
  let logId;

  if (db) {
    try {
      const logRef = await db.collection('emailLogs').add({
        to,
        subject,
        template,
        transport: useResend ? 'resend' : 'smtp',
        orderId:   orderId || null,
        messageId: messageId || null,
        status:    succeeded ? 'sent' : 'failed',
        error:     succeeded ? null : (lastError?.message || 'Unknown error'),
        retries:   MAX_RETRIES,
        sentAt:    new Date(),
        createdAt: new Date(),
      });
      logId = logRef.id;
    } catch (logErr) {
      console.error('⚠️  Failed to write emailLog to Firestore:', logErr.message);
    }
  }

  if (!succeeded) {
    return { success: false, error: lastError?.message || 'Send failed after retries', logId };
  }

  return { success: true, messageId, logId };
}

// ─── SMTP / Resend Verification ───────────────────────────────────────────────

/**
 * Verify mail connectivity with an 8-second timeout.
 * @returns {Promise<{connected:boolean, service:string, error?:string}>}
 */
export async function verifySmtp() {
  if (process.env.RESEND_API_KEY) {
    return { connected: true, service: 'resend' };
  }

  const transporter = getTransporter();
  try {
    await Promise.race([
      new Promise((resolve, reject) =>
        transporter.verify((err, ok) => (err ? reject(err) : resolve(ok)))
      ),
      sleep(8_000).then(() => { throw new Error('SMTP verification timed out after 8s'); }),
    ]);
    return { connected: true, service: 'smtp' };
  } catch (err) {
    return { connected: false, service: 'smtp', error: err.message };
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
