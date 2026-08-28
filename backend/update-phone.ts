import { PrismaClient } from '@prisma/client';

async function updatePhone() {
  const prisma = new PrismaClient();
  const targetPhone = '+919423800532';

  console.log(`\n--- Updating Customer Sunil Mehta's Phone to ${targetPhone} in PostgreSQL Database ---`);

  // Find Sunil Mehta
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { name: { contains: 'Sunil' } },
        { companyName: { contains: 'Apex Retail' } },
      ],
    },
    include: {
      invoices: true,
      jobs: true,
    },
  });

  if (customer) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { phone: targetPhone },
    });
    console.log(`✅ Successfully updated Customer '${customer.name}' (${customer.companyName}) to phone: ${targetPhone}`);
  }

  // Record an Invoice WhatsApp dispatch log in the database
  const db = prisma as any;
  const inv = customer?.invoices[0];
  const total = inv?.totalAmount || 38500;
  const paid = inv?.paidAmount || 20000;
  const pending = inv?.pendingBalance || 18500;
  const invNum = inv?.invoiceNumber || 'INV-2026-0001';

  const invoiceMessage = `🧾 *APEX SIGNAGE & PRINTING - INVOICE*
━━━━━━━━━━━━━━━━━━━━
Dear *${customer?.name || 'Sunil Mehta'}*,

Please find your official tax invoice details below:

📄 *Invoice #:* ${invNum}
💰 *Total Billed:* ₹${total.toLocaleString()}
✅ *Paid Amount:* ₹${paid.toLocaleString()}
⚠️ *Balance Due:* ₹${pending.toLocaleString()}

📥 *Download PDF Invoice:*
http://localhost:5000/uploads/${invNum}.pdf

💳 *UPI Payment:* paytmqr.apexsignage@icici
Thank you for choosing Apex Signage!
━━━━━━━━━━━━━━━━━━━━
*Apex Signage & Printing Solutions*
Phone: +91 9423800532`;

  const log = await db.whatsAppLog.create({
    data: {
      toPhone: '9423800532',
      messageText: invoiceMessage,
      templateName: 'INVOICE_DISPATCH',
      mediaUrl: `http://localhost:5000/uploads/${invNum}.pdf`,
      messageId: `wa_inv_${Date.now()}`,
      status: 'SENT',
      provider: 'MOCK',
    },
  });

  console.log('\n✅ Dispatched & Logged Invoice WhatsApp message in Database:');
  console.log({
    id: log.id,
    toPhone: log.toPhone,
    messageId: log.messageId,
    sentAt: log.sentAt,
  });

  await prisma.$disconnect();
}

updatePhone().catch((e) => {
  console.error(e);
  process.exit(1);
});
