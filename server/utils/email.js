const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOrderEmail = async (order, items, userEmail, isAdmin = false) => {
    // Safety check for mail configuration
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email')) {
        console.warn('⚠️ Email not configured. Skipping email send.');
        return;
    }

    if (!order || !items || items.length === 0) return;

    const subject = isAdmin ? `New Order Received - #${order.id}` : `Order Confirmation - RETROSTYLINGS #${order.id}`;
    const targetEmail = isAdmin ? process.env.ADMIN_EMAIL : userEmail;

    const itemsHtml = items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name} (${item.size || 'N/A'})</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${Number(item.price).toFixed(2)}</td>
        </tr>
    `).join('');

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                <h1 style="margin: 0; letter-spacing: 2px;">RETROSTYLINGS</h1>
            </div>
            
            <div style="padding: 30px; border: 1px solid #eee;">
                <h2>${isAdmin ? 'A new order has been placed!' : 'Thank you for your order!'}</h2>
                <p>Hello ${isAdmin ? 'Admin' : 'Shopper'},</p>
                <p>${isAdmin ? 'User ' + userEmail : 'Your order'} has been successfully placed. Here are the details:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #f8f8f8;">
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <th style="padding: 10px; text-align: center;">Qty</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 20px 10px 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                            <td style="padding: 20px 10px 10px; text-align: right; font-weight: bold;">₹${Number(order.total).toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="background: #fdfdfd; padding: 15px; border: 1px dashed #ccc;">
                    <p style="margin: 0;"><strong>Shipping Address:</strong> ${order.shippingAddress}</p>
                    <p style="margin: 5px 0 0;"><strong>Phone:</strong> ${order.phone}</p>
                </div>

                <p style="margin-top: 30px;">Status: <strong>${order.status || 'Processing'}</strong></p>
            </div>
            
            <div style="padding: 20px; text-align: center; font-size: 12px; color: #999;">
                &copy; 2026 RETROSTYLINGS | All Rights Reserved
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"RETROSTYLINGS" <${process.env.EMAIL_USER}>`,
            to: targetEmail,
            subject: subject,
            html: htmlContent
        });
        console.log(`✅ Email sent to ${targetEmail}`);
    } catch (err) {
        console.error('❌ Email failed:', err.message);
    }
};

module.exports = { sendOrderEmail };
