import { buildOrderConfirmEmail } from './lib/mail/templates/orderConfirm.js';
import { buildWelcomeEmail } from './lib/mail/templates/welcome.js';
import { buildOrderStatusEmail } from './lib/mail/templates/orderStatus.js';
import fs from 'fs';

const orderHtml = buildOrderConfirmEmail({
  orderId: 'TEST123456789AB',
  customerName: 'Muneeswaran R',
  items: [
    { name: 'Retro Cargo Pants', size: 'M', color: 'Black', quantity: 1, price: 1499 },
    { name: 'Street Graphic Tee', size: 'L', color: 'White', quantity: 2, price: 699 },
  ],
  total: 2897, shipping: 0, discount: 0,
  shippingAddress: '12 Anna Nagar, Chennai 600040, Tamil Nadu',
  phone: '+91 98765 43210',
  paymentMethod: 'upi', estimatedDelivery: '25–28 Jul 2026',
});

const welcomeHtml = buildWelcomeEmail({
  customerName: 'Muneeswaran R',
  verifyLink: 'https://retrostylings.in/verify?token=abc123',
});

const shippedHtml = buildOrderStatusEmail({
  orderId: 'TEST123456789AB',
  customerName: 'Muneeswaran R',
  status: 'shipped',
  trackingNumber: 'DXBIND123456789',
  courierPartner: 'Delhivery',
  estimatedDelivery: '25–28 Jul 2026',
  items: [
    { name: 'Retro Cargo Pants', size: 'M', color: 'Black', quantity: 1, price: 1499 },
  ],
  total: 1499,
});

fs.writeFileSync('./preview-order-confirm.html', orderHtml);
fs.writeFileSync('./preview-welcome.html', welcomeHtml);
fs.writeFileSync('./preview-shipped.html', shippedHtml);

console.log('✅ Previews generated:');
console.log('   preview-order-confirm.html', orderHtml.length, 'bytes');
console.log('   preview-welcome.html', welcomeHtml.length, 'bytes');
console.log('   preview-shipped.html', shippedHtml.length, 'bytes');
