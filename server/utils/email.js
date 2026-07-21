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

const sendReturnStatusEmail = async (order, userEmail, status, details = {}, isAdmin = false) => {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email')) {
        console.warn('⚠️ Email not configured. Skipping return email send.');
        return;
    }

    const orderId = order.id || order.orderId;
    const targetEmail = isAdmin ? (process.env.ADMIN_EMAIL || process.env.EMAIL_USER) : userEmail;
    if (!targetEmail) return;

    let subject = `Return Update - RETROSTYLINGS #${orderId}`;
    let title = 'Return Status Update';
    let bodyMessage = `The return status for order #${orderId} has been updated to: <strong>${status}</strong>.`;

    switch (status) {
        case 'pending':
        case 'return_requested':
            subject = isAdmin ? `🚨 New Return Requested - #${orderId}` : `Return Request Received - RETROSTYLINGS #${orderId}`;
            title = isAdmin ? '🚨 New Return Request Submitted' : 'Return Request Received ↩️';
            bodyMessage = isAdmin 
                ? `Customer (${userEmail}) requested return for order #${orderId}. Reason: <strong>${details.reason || 'N/A'}</strong>.`
                : `We received your return request for order #${orderId}. Our team will review it within 24–48 hours.`;
            break;
        case 'approved':
        case 'return_approved':
            subject = `Return Request Approved - RETROSTYLINGS #${orderId}`;
            title = 'Return Approved ✅';
            bodyMessage = `Your return request for order #${orderId} has been approved. ${details.pickupDate ? `<br/><strong>Pickup Date:</strong> ${details.pickupDate}` : ''}`;
            break;
        case 'rejected':
        case 'return_rejected':
            subject = `Return Request Update - RETROSTYLINGS #${orderId}`;
            title = 'Return Request Rejected ❌';
            bodyMessage = `We reviewed your return request for order #${orderId}. Unfortunately, we cannot process this return. ${details.rejectionReason ? `<br/><strong>Reason:</strong> ${details.rejectionReason}` : ''}`;
            break;
        case 'pickup_scheduled':
            subject = `Return Pickup Scheduled - RETROSTYLINGS #${orderId}`;
            title = 'Pickup Scheduled 🚚';
            bodyMessage = `Pickup agent will arrive to pick up returned items for order #${orderId}. ${details.pickupDate ? `<br/><strong>Scheduled Date:</strong> ${details.pickupDate}` : ''}`;
            break;
        case 'return_picked_up':
            subject = `Return Item Picked Up - RETROSTYLINGS #${orderId}`;
            title = 'Item Picked Up 📦';
            bodyMessage = `Your return package for order #${orderId} has been picked up by our courier.`;
            break;
        case 'received':
        case 'return_received':
            subject = `Returned Item Received - RETROSTYLINGS #${orderId}`;
            title = 'Returned Product Received 🏬';
            bodyMessage = `We received your returned item for order #${orderId} at our warehouse. Quality check is in progress.`;
            break;
        case 'refund_initiated':
            subject = `Refund Initiated - RETROSTYLINGS #${orderId}`;
            title = 'Refund Initiated 💳';
            bodyMessage = `Quality check passed! Refund of <strong>₹${Number(details.refundAmount || order.total || 0).toFixed(2)}</strong> has been initiated.`;
            break;
        case 'refund_completed':
        case 'refunded':
            subject = `Refund Processed - RETROSTYLINGS #${orderId}`;
            title = 'Refund Processed Successfully 💰';
            bodyMessage = `Your refund of <strong>₹${Number(details.refundAmount || order.total || 0).toFixed(2)}</strong> for order #${orderId} has been completed.`;
            break;
    }

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                <h1 style="margin: 0; letter-spacing: 2px;">RETROSTYLINGS</h1>
            </div>
            
            <div style="padding: 30px; border: 1px solid #eee;">
                <h2>${title}</h2>
                <p>${bodyMessage}</p>
                
                <div style="background: #fdfdfd; padding: 15px; border: 1px dashed #ccc; margin-top: 20px;">
                    <p style="margin: 0;"><strong>Order ID:</strong> #${orderId}</p>
                    <p style="margin: 5px 0 0;"><strong>Status:</strong> ${status}</p>
                    ${details.note ? `<p style="margin: 5px 0 0;"><strong>Note:</strong> ${details.note}</p>` : ''}
                </div>
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
        console.log(`✅ Return email (${status}) sent to ${targetEmail}`);
    } catch (err) {
        console.error('❌ Return email failed:', err.message);
    }
};

module.exports = { sendOrderEmail, sendReturnStatusEmail };

