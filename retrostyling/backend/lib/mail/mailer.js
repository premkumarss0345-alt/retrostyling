/**
 * mailer.js – Core email service for RetroStylings
 *
 * Provides:
 *  - Nodemailer transporter (Hostinger SMTP, port 465 SSL)
 *  - sendEmail()   – sends mail with auto-retry (up to 3 attempts) + Firestore logging
 *  - logEmail()    – writes/updates an emailLogs Firestore document
 *  - verifySmtp()  – tests SMTP connectivity with a timeout
 */

import nodemailer from 'nodemailer';

// ─── Transporter ──────────────────────────────────────────────────────────────

/**
 * Singleton Nodemailer transporter.
 * Config is read from environment variables at runtime so no credentials are
 * ever hard-coded in source.
 */
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
      // Generous timeouts for reliability
      connectionTimeout: 10_000,
      greetingTimeout:   10_000,
      socketTimeout:     30_000,
    });
  }
  return _transporter;
}

// ─── Email Sender with Retry ───────────────────────────────────────────────────

const MAX_RETRIES    = 3;
const RETRY_BASE_MS  = 1_000; // 1 s → 2 s → 4 s (exponential)

/**
 * Send an email with auto-retry and Firestore logging.
 *
 * @param {object}  opts
 * @param {string}  opts.to          – Recipient email address
 * @param {string}  opts.subject     – Email subject line
 * @param {string}  opts.html        – HTML body
 * @param {string}  [opts.template]  – Template name for logging (e.g. 'orderConfirm')
 * @param {string}  [opts.orderId]   – Associated order ID for logging
 * @param {object}  [opts.db]        – Firebase Admin Firestore instance (optional)
 * @returns {Promise<{success:boolean, messageId?:string, logId?:string, error?:string}>}
 */
export async function sendEmail({ to, subject, html, template = 'unknown', orderId, db }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured – email skipped for:', to);
    return { success: false, error: 'SMTP credentials not set' };
  }

  const transporter = getTransporter();
  const from        = process.env.EMAIL_FROM || `"RetroStylings" <${process.env.SMTP_USER}>`;
  const replyTo     = process.env.EMAIL_REPLY_TO || process.env.SMTP_USER;

  let lastError;
  let messageId;

  // ── Retry loop ──────────────────────────────────────────────────────────────
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const info = await transporter.sendMail({ from, replyTo, to, subject, html });
      messageId  = info.messageId;
      console.log(`📧 [attempt ${attempt}/${MAX_RETRIES}] Email sent → ${to} | ${subject} | id:${messageId}`);
      break; // success – exit retry loop
    } catch (err) {
      lastError = err;
      console.error(`❌ [attempt ${attempt}/${MAX_RETRIES}] Email failed → ${to} | ${err.message}`);

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

// ─── SMTP Verification ────────────────────────────────────────────────────────

/**
 * Verify SMTP connectivity with an 8-second timeout.
 * @returns {Promise<{connected:boolean, error?:string}>}
 */
export async function verifySmtp() {
  const transporter = getTransporter();
  try {
    await Promise.race([
      new Promise((resolve, reject) =>
        transporter.verify((err, ok) => (err ? reject(err) : resolve(ok)))
      ),
      sleep(8_000).then(() => { throw new Error('SMTP verification timed out after 8s'); }),
    ]);
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
