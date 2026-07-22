const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendOrderNotification(order) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #C6A15B; padding: 24px;">
      <h2 style="color:#0E1B3D;">New FlexFit Order</h2>
      <p><strong>Product:</strong> ${order.productName}</p>
      <p><strong>Price:</strong> Rs. ${order.productPrice}</p>
      <p><strong>Quantity:</strong> ${order.quantity}</p>
      <p><strong>Size:</strong> ${order.size}</p>
      <hr/>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Address:</strong> ${order.address}</p>
      <p><strong>Notes:</strong> ${order.notes || "-"}</p>
      <hr/>
      <p style="color:#888;font-size:12px;">Order ID: ${order._id}</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"FlexFit Orders" <${process.env.SMTP_EMAIL}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `New Order: ${order.productName} (x${order.quantity})`,
    html,
  });
}

module.exports = { sendOrderNotification };