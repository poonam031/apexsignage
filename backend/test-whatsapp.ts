import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const phone = '9309512730';
  const customerName = 'Sunil Mehta (Apex Retail)';
  const jobCode = 'JB-2026-0001';
  const trackingUrl = 'http://localhost:5000/uploads/tracking.html';

  console.log(`\n--- Dispatching WhatsApp Notification to ${phone} ---`);

  // 1. Prepare stage update message text
  const messageText = `Hello ${customerName},\n\nYour signage project [${jobCode}] is now at stage: *PRINTING* (High-Definition UV Backlit).\n\nTrack your live project progress in real-time:\n${trackingUrl}\n\nThank you for choosing Apex Signage!`;
  const messageId = `wa_msg_${Date.now()}_test_${Math.random().toString(36).substring(2, 7)}`;

  // 2. Persist WhatsApp message log to PostgreSQL database
  console.log('Saving message log into PostgreSQL database table `WhatsAppLog`...');
  const db = prisma as any;
  const savedLog = await db.whatsAppLog.create({
    data: {
      toPhone: phone,
      messageText,
      templateName: 'STAGE_UPDATE_NOTIFICATION',
      mediaUrl: 'http://localhost:5000/uploads/JB-2026-0001-proof.pdf',
      messageId,
      status: 'SENT',
      provider: process.env.WHATSAPP_PROVIDER || 'MOCK',
    },
  });

  console.log('✅ Successfully saved WhatsApp message record to Database:');
  console.log({
    id: savedLog.id,
    toPhone: savedLog.toPhone,
    messageId: savedLog.messageId,
    status: savedLog.status,
    sentAt: savedLog.sentAt,
  });

  // 3. Query back saved logs for 9309512730 from PostgreSQL
  console.log(`\n--- Fetching Stored WhatsApp History for ${phone} from PostgreSQL ---`);
  const logs = await db.whatsAppLog.findMany({
    where: { toPhone: { contains: phone } },
    orderBy: { sentAt: 'desc' },
  });

  console.log(`Found ${logs.length} stored WhatsApp log(s) for ${phone}:`);
  logs.forEach((log: any, idx: number) => {
    console.log(`\n[Log #${idx + 1}] ID: ${log.id}`);
    console.log(`To: ${log.toPhone} | Status: ${log.status} | Provider: ${log.provider}`);
    console.log(`Message Content:\n${log.messageText}`);
    console.log(`Timestamp: ${log.sentAt}`);
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
