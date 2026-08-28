import 'package:url_launcher/url_launcher.dart';
import '../network/api_client.dart';

class WhatsAppLauncher {
  /// Cleans and formats phone number into international format (default India +91 if 10 digits)
  static String formatPhoneNumber(String phone) {
    String digits = phone.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 10) {
      digits = '91$digits';
    }
    return digits;
  }

  /// Launches real-time WhatsApp chat with pre-filled message and records log in database
  static Future<bool> launchWhatsApp({
    required String phone,
    required String messageText,
  }) async {
    final formattedPhone = formatPhoneNumber(phone.isNotEmpty ? phone : '9423800532');
    final encodedText = Uri.encodeComponent(messageText);

    // 1. Native WhatsApp App Deep Link (instant open on mobile)
    final nativeUri = Uri.parse('whatsapp://send?phone=$formattedPhone&text=$encodedText');
    // 2. Web fallback (opens WhatsApp Web or redirects to WhatsApp App via browser)
    final webUri = Uri.parse('https://api.whatsapp.com/send?phone=$formattedPhone&text=$encodedText');

    // Record log in Backend Database
    try {
      await ApiClient.post('/notifications/dispatch', {
        'customerPhone': formattedPhone,
        'title': 'WhatsApp Direct Dispatch',
        'message': messageText,
        'channels': ['WHATSAPP'],
      });
    } catch (_) {}

    // Try native WhatsApp app first
    try {
      if (await canLaunchUrl(nativeUri)) {
        return await launchUrl(nativeUri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}

    // Fallback to web link
    try {
      return await launchUrl(webUri, mode: LaunchMode.externalApplication);
    } catch (_) {
      try {
        return await launchUrl(webUri, mode: LaunchMode.platformDefault);
      } catch (_) {
        return false;
      }
    }
  }

  /// Real-time Invoice Share
  static Future<bool> shareInvoice({
    required String phone,
    required String customerName,
    required String invoiceNumber,
    required double totalAmount,
    required double paidAmount,
    required double pendingBalance,
    String? pdfUrl,
  }) async {
    final targetPhone = phone.isNotEmpty ? phone : '9423800532';
    final pdfLink = pdfUrl ?? 'http://localhost:5000/uploads/INV-2026-0001.pdf';
    
    final message = '''
🧾 *APEX SIGNAGE & PRINTING - INVOICE*
━━━━━━━━━━━━━━━━━━━━
Dear *${customerName.isNotEmpty ? customerName : 'Valued Customer'}*,

Please find your official tax invoice details below:

📄 *Invoice #:* $invoiceNumber
💰 *Total Billed:* ₹${totalAmount.toStringAsFixed(0)}
✅ *Paid Amount:* ₹${paidAmount.toStringAsFixed(0)}
⚠️ *Balance Due:* ₹${pendingBalance.toStringAsFixed(0)}

📥 *Download PDF Invoice:*
$pdfLink

💳 *UPI Payment:* paytmqr.apexsignage@icici
Thank you for your business!
━━━━━━━━━━━━━━━━━━━━
*Apex Signage & Printing Solutions*
Phone: +91 9423800532
'''.trim();

    return await launchWhatsApp(phone: targetPhone, messageText: message);
  }

  /// Real-time Live Project Tracking Share
  static Future<bool> shareLiveTracking({
    required String phone,
    required String customerName,
    required String jobCode,
    required String currentStage,
    required String trackingToken,
  }) async {
    final targetPhone = phone.isNotEmpty ? phone : '9423800532';
    final trackingUrl = 'http://localhost:5000/uploads/tracking.html?token=$trackingToken';

    final message = '''
🖨️ *APEX SIGNAGE - LIVE PRODUCTION UPDATE*
━━━━━━━━━━━━━━━━━━━━
Hello *${customerName.isNotEmpty ? customerName : 'Client'}*,

Your signage order [*$jobCode*] has progressed!
📍 *Current Stage:* *$currentStage*

🔍 *Track Live Production & Delivery Progress in Real-Time:*
$trackingUrl

Need modifications or have questions? Reply directly to this WhatsApp message.
━━━━━━━━━━━━━━━━━━━━
*Apex Signage Team*
'''.trim();

    return await launchWhatsApp(phone: targetPhone, messageText: message);
  }
}
