const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOrderNotification(order) {
  const itemsHtml = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:6px 0;">${i.name} ${i.size !== "N/A" ? `(${i.size})` : ""} x${i.quantity}</td>
        <td style="padding:6px 0; text-align:right;">Rs. ${(i.price * i.quantity).toLocaleString()}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #C6A15B; padding: 24px;">
      <h2 style="color:#0E1B3D;">New FlexFit Order</h2>
      <table style="width:100%; border-collapse:collapse;">${itemsHtml}</table>
      <hr/>
      <p><strong>Total: Rs. ${order.totalAmount.toLocaleString()}</strong></p>
      <p><strong>Payment:</strong> ${order.paymentMethod}</p>
      <hr/>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Address:</strong> ${order.address}${order.city ? ", " + order.city : ""}</p>
      <p><strong>Notes:</strong> ${order.notes || "-"}</p>
      <hr/>
      <p style="color:#888;font-size:12px;">Order ID: ${order._id}</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: "FlexFit Orders <onboarding@resend.dev>",
    to: process.env.NOTIFY_EMAIL,
    subject: `New Order: ${order.items.length} item(s) - Rs. ${order.totalAmount.toLocaleString()}`,
    html,
  });

  if (error) {
    throw new Error(error.message || "Resend failed to send email");
  }
}

module.exports = { sendOrderNotification };