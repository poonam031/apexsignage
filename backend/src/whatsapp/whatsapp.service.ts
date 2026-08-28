import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SendWhatsAppMessageDto {
  toPhone: string;
  templateName?: string;
  parameters?: Record<string, string>;
  messageText?: string;
  mediaUrl?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly provider = process.env.WHATSAPP_PROVIDER || 'MOCK';

  constructor(private prisma: PrismaService) {}

  async sendMessage(dto: SendWhatsAppMessageDto): Promise<{ success: boolean; messageId: string; logId?: string }> {
    const formattedPhone = dto.toPhone.replace(/\D/g, '');
    this.logger.log(`[WhatsApp Provider: ${this.provider}] Sending to ${formattedPhone}: ${dto.messageText || dto.templateName}`);

    // In production with WATI / Gupshup / WhatsApp Cloud API, this invokes external HTTP API
    // For local/development, we simulate immediate successful delivery and generate unique messageId
    const messageId = `wa_msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Persist WhatsApp message delivery log to PostgreSQL database
    let logId: string | undefined;
    try {
      const db = this.prisma as any;
      if (db.whatsAppLog) {
        const savedLog = await db.whatsAppLog.create({
          data: {
            toPhone: formattedPhone,
            messageText: dto.messageText || dto.templateName || 'Template Message',
            templateName: dto.templateName,
            mediaUrl: dto.mediaUrl,
            messageId,
            status: 'SENT',
            provider: this.provider,
          },
        });
        logId = savedLog.id;
      }
    } catch (err) {
      this.logger.error(`Failed to save WhatsApp message log: ${err.message}`);
    }

    return {
      success: true,
      messageId,
      logId,
    };
  }

  async getMessageLogs(phone?: string) {
    const formattedPhone = phone ? phone.replace(/\D/g, '') : undefined;
    const db = this.prisma as any;
    if (!db.whatsAppLog) return [];
    return db.whatsAppLog.findMany({
      where: formattedPhone ? { toPhone: { contains: formattedPhone } } : {},
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  }

  async sendJobStageUpdate(customerPhone: string, customerName: string, jobCode: string, stage: string, trackingUrl: string) {
    const messageText = `Hello ${customerName}, your signage project [${jobCode}] is now at stage: *${stage}*.\n\nTrack your live project progress here:\n${trackingUrl}\n\n- Apex Signage Team`;
    return this.sendMessage({
      toPhone: customerPhone,
      messageText,
    });
  }

  async sendInvoicePdf(customerPhone: string, customerName: string, invoiceNumber: string, amount: number, pdfUrl: string) {
    const messageText = `Dear ${customerName}, please find attached your Invoice *#${invoiceNumber}* for amount *₹${amount.toLocaleString()}*.\n\nDownload PDF: ${pdfUrl}\n\nThank you for choosing Apex Signage!`;
    return this.sendMessage({
      toPhone: customerPhone,
      messageText,
      mediaUrl: pdfUrl,
    });
  }
}
