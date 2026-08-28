import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/utils/measurement_calculator.dart';
import '../../../core/utils/whatsapp_launcher.dart';
import '../../../core/widgets/status_badge.dart';
import '../../../core/widgets/custom_button.dart';
import '../../feedback/screens/signature_capture_screen.dart';

class JobDetailScreen extends StatefulWidget {
  final Map<String, dynamic> job;

  const JobDetailScreen({Key? key, required this.job}) : super(key: key);

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  late Map<String, dynamic> _job;
  bool _isUpdatingStage = false;

  @override
  void initState() {
    super.initState();
    _job = Map<String, dynamic>.from(widget.job);
  }

  @override
  Widget build(BuildContext context) {
    final customer = _job['customer'] ?? {};
    final currentStage = _job['currentStage'] ?? 'SITE_VISIT';
    final qrToken = _job['qrCodeToken'] ?? 'mock-qr-token-jb-2026-0001';
    final trackingToken = _job['trackingToken'] ?? 'mock-track-token-jb-2026-0001';
    final measurements = (_job['measurements'] as List?) ?? [];
    final primaryMeasurement = measurements.isNotEmpty ? measurements[0] : null;
    final feedback = (_job['feedbacks'] as List?)?.isNotEmpty == true ? _job['feedbacks'][0] : null;
    final stageHistory = (_job['stageHistory'] as List?) ?? [];
    final operator = _job['assignedOperator'];
    final installer = _job['assignedInstaller'];

    final length = (primaryMeasurement?['length'] ?? 14.0).toDouble();
    final height = (primaryMeasurement?['height'] ?? 4.5).toDouble();
    final sqFt = (primaryMeasurement?['squareFeet'] ?? _job['totalSqFt'] ?? 63.0).toDouble();
    final sqM = (primaryMeasurement?['squareMeters'] ?? (sqFt * 0.092903)).toDouble();

    final totalAmount = (_job['totalAmount'] ?? 38500.0).toDouble();
    final paidAmount = (_job['paidAmount'] ?? 20000.0).toDouble();
    final pendingAmount = totalAmount - paidAmount;

    return Scaffold(
      appBar: AppBar(
        title: Text(_job['jobCode'] ?? 'Digital Job Card'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_2),
            tooltip: 'View Printable Job QR Code',
            onPressed: () => _showQrModal(qrToken),
          ),
          IconButton(
            icon: const Icon(Icons.share_location),
            tooltip: 'Share Live Customer Tracking Link',
            onPressed: () => _shareTrackingLink(trackingToken),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomActionBar(currentStage, customer),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. PRIMARY JOB HEADER CARD
            Card(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                _job['jobCode'] ?? 'JB-2026-0001',
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Colors.white),
                              ),
                            ),
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: () => _showQrModal(qrToken),
                              child: const Icon(Icons.qr_code, color: AppColors.accent, size: 22),
                            ),
                          ],
                        ),
                        StatusBadge(status: currentStage),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _job['boardType'] ?? 'Glow Sign Board ACP Frontlit',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 8),
                    // Customer info with 1-tap dial
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.business, color: AppColors.primary, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  customer['companyName'] ?? customer['name'] ?? 'Apex Retail Hub',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                Text(
                                  'Contact: ${customer['name'] ?? 'Manager'} • ${customer['phone'] ?? '+91 98765 43210'}',
                                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.phone, color: AppColors.success, size: 20),
                            tooltip: 'Call Customer',
                            onPressed: () => _launchCaller(customer['phone'] ?? '+91 9309512730'),
                          ),
                          IconButton(
                            icon: const Icon(Icons.chat, color: Colors.green, size: 20),
                            tooltip: 'Chat on WhatsApp (9309512730)',
                            onPressed: () {
                              WhatsAppLauncher.shareLiveTracking(
                                phone: customer['phone'] ?? '9309512730',
                                customerName: customer['name'] ?? 'Client',
                                jobCode: _job['jobCode'] ?? 'JB-2026-0001',
                                currentStage: currentStage,
                                trackingToken: trackingToken,
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Assigned Staff Bar
                    Row(
                      children: [
                        Expanded(
                          child: _buildStaffChip('Operator', operator?['name'] ?? 'Ramesh (Designer)', Icons.brush),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildStaffChip('Installer', installer?['name'] ?? 'Vikram (Installer)', Icons.build),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 2. SMART MEASUREMENTS & SPECIFICATIONS CARD
            const Text(
              'Smart Measurements & Material Specs',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            Card(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildSpecItem('Dimensions', '$length ft × $height ft', Icons.straighten),
                        ),
                        Expanded(
                          child: _buildSpecItem('Total Area', '${sqFt.toStringAsFixed(1)} Sq.Ft (${sqM.toStringAsFixed(2)} Sq.M)', Icons.aspect_ratio),
                        ),
                      ],
                    ),
                    const Divider(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: _buildSpecItem('Selected Material', _job['materialType'] ?? 'Star Flex 440 GSM', Icons.layers),
                        ),
                        Expanded(
                          child: _buildSpecItem('Structure / Frame', _job['pipeGauge'] ?? '1.5" x 1.5" (16 Gauge)', Icons.grid_4x4),
                        ),
                      ],
                    ),
                    const Divider(height: 18),
                    // Technical Checklist Highlights
                    Row(
                      children: [
                        _buildChecklistTag('⚡ 230V Power Ready', true),
                        const SizedBox(width: 6),
                        _buildChecklistTag('🏗️ Scaffolding Req.', true),
                        const SizedBox(width: 6),
                        _buildChecklistTag('🧱 RCC Pillar Mount', true),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 3. MEDIA & DESIGN PROOF ATTACHMENTS
            const Text(
              'Site Photos, 10s Video & Design Proof',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            Card(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildMediaTile(
                            'Site Facade Photo',
                            'Annotated with $length x $height ft markers',
                            Icons.photo_camera,
                            Colors.blue.shade700,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildMediaTile(
                            '10s Video Capture',
                            'Road clearance & hookup video',
                            Icons.videocam,
                            Colors.purple.shade700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.amber.shade300),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.palette, color: Colors.amber, size: 20),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Vector Proof v2.0 • Approved by Client for Printing',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.brown),
                            ),
                          ),
                          Icon(Icons.check_circle, color: AppColors.success, size: 18),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // 4. PRODUCTION WORKFLOW PROGRESS (6 STAGES)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Production Stage Lifecycle',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                ),
                Text(
                  'Current: $currentStage',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.accent),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Card(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Column(
                  children: [
                    _buildTimelineStep(1, 'Site Visit & Smart Measurement', 'SITE_VISIT', currentStage, 'Completed by Field Boy • 27 Aug, 10:20 AM'),
                    _buildTimelineStep(2, 'Design Final & Proof Approval', 'DESIGN_FINAL', currentStage, 'Vector Proof v2.0 Approved • 27 Aug, 01:40 PM'),
                    _buildTimelineStep(3, 'High-Definition Printing (DPR)', 'PRINTING', currentStage, 'Eco-Solvent Machine #1 • 27 Aug, 03:10 PM'),
                    _buildTimelineStep(4, 'Fabrication & 3D Assembly', 'FABRICATION', currentStage, 'Welding & LED Module Mounting'),
                    _buildTimelineStep(5, 'Site Installation & Wiring', 'INSTALLATION', currentStage, 'Installer Team on site with Tempo'),
                    _buildTimelineStep(6, 'Delivered & Customer Sign-Off', 'DELIVERED', currentStage, 'E-Signature & 5-Star Feedback', isLast: true),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // 5. STAGE HISTORY AUDIT TRAIL
            if (stageHistory.isNotEmpty) ...[
              const Text(
                'Stage History & Audit Log',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 8),
              Card(
                margin: EdgeInsets.zero,
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: stageHistory.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (ctx, idx) {
                    final item = stageHistory[idx];
                    final updatedBy = item['updatedBy'];
                    return ListTile(
                      dense: true,
                      leading: const CircleAvatar(
                        radius: 12,
                        backgroundColor: AppColors.primary,
                        child: Icon(Icons.history, size: 14, color: Colors.white),
                      ),
                      title: Text(
                        'Stage: ${item['stage']}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      subtitle: Text(
                        '${item['remarks'] ?? 'Updated'}\nBy: ${updatedBy?['name'] ?? 'Staff'} (${updatedBy?['role'] ?? 'SYSTEM'})',
                        style: const TextStyle(fontSize: 11),
                      ),
                      trailing: Text(
                        item['completedAt'] != null ? item['completedAt'].toString().substring(0, 10) : 'Today',
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),
            ],

            // 6. FINANCIALS, QUOTATION & PAYMENT STATUS
            const Text(
              'Quotation, Invoicing & Payment Ledger',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            Card(
              margin: EdgeInsets.zero,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildStatPill('Contract Total (GST 18%)', MeasurementCalculator.formatCurrency(totalAmount)),
                        _buildStatPill('Received Payment', MeasurementCalculator.formatCurrency(paidAmount)),
                        _buildStatPill('Balance Due', MeasurementCalculator.formatCurrency(pendingAmount), isHighlight: pendingAmount > 0),
                      ],
                    ),
                    const Divider(height: 16),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.green.shade100,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('Invoice: INV-2026-0001 (50% Advance Paid)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green)),
                        ),
                        const Spacer(),
                        const Text('Rate: ₹350/Sq.Ft', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // 7. CUSTOMER DIGITAL SIGN-OFF & REVIEW
            if (currentStage == 'DELIVERED') ...[
              const Text(
                'Customer Verified Sign-Off & Review',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 8),
              Card(
                margin: EdgeInsets.zero,
                color: Colors.teal.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.verified_user, color: Colors.teal, size: 20),
                          const SizedBox(width: 8),
                          const Text(
                            'Verified Digital Customer Sign-Off',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.teal),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: Colors.teal, borderRadius: BorderRadius.circular(4)),
                            child: const Text('⭐⭐⭐⭐⭐ 5.0', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        feedback?['feedbackText'] ?? 'Super high quality glowing acrylic letters! Installed perfectly on time without any hassle.',
                        style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6), border: Border.all(color: Colors.teal.shade200)),
                        child: const Row(
                          children: [
                            Icon(Icons.draw, size: 16, color: Colors.teal),
                            SizedBox(width: 6),
                            Text('Digital Signature Captured on Glass: Rajesh Patel (Owner)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ],
        ),
      ),
    );
  }

  Widget? _buildBottomActionBar(String currentStage, Map<String, dynamic> customer) {
    if (currentStage == 'INSTALLATION') {
      return Container(
        padding: const EdgeInsets.all(16),
        color: Colors.white,
        child: SafeArea(
          child: CustomButton(
            label: 'Collect Customer E-Signature & Finish',
            icon: Icons.draw,
            backgroundColor: Colors.teal.shade700,
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => SignatureCaptureScreen(
                    jobCode: _job['jobCode'] ?? 'JB-2026-0001',
                    customerName: customer['name'] ?? 'Client',
                    onSaved: (sigBase64, rating, comment) {
                      setState(() {
                        _job['currentStage'] = 'DELIVERED';
                        _job['status'] = 'COMPLETED';
                      });
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('🎉 Job Delivered! Digital signature and 5-star rating saved.'),
                          backgroundColor: AppColors.success,
                        ),
                      );
                    },
                  ),
                ),
              );
            },
          ),
        ),
      );
    }

    if (currentStage == 'PRINTING') {
      return Container(
        padding: const EdgeInsets.all(16),
        color: Colors.white,
        child: SafeArea(
          child: CustomButton(
            label: 'Advance to Fabrication Stage',
            icon: Icons.build,
            isLoading: _isUpdatingStage,
            backgroundColor: AppColors.primary,
            onPressed: () => _advanceStage('FABRICATION'),
          ),
        ),
      );
    }

    if (currentStage == 'FABRICATION') {
      return Container(
        padding: const EdgeInsets.all(16),
        color: Colors.white,
        child: SafeArea(
          child: CustomButton(
            label: 'Dispatch for Site Installation',
            icon: Icons.local_shipping,
            isLoading: _isUpdatingStage,
            backgroundColor: AppColors.accent,
            onPressed: () => _advanceStage('INSTALLATION'),
          ),
        ),
      );
    }

    return null;
  }

  Future<void> _advanceStage(String nextStage) async {
    setState(() => _isUpdatingStage = true);
    final qrToken = _job['qrCodeToken'] ?? '';
    final response = await ApiClient.post('/job-stages/scan-update', {
      'qrCodeToken': qrToken,
      'targetStage': nextStage,
      'remarks': 'Stage advanced via Digital Job Card action button',
    });

    setState(() => _isUpdatingStage = false);

    if (response.success) {
      setState(() {
        _job['currentStage'] = nextStage;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ Production stage successfully advanced to $nextStage!'),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      // Local demo fallback
      setState(() {
        _job['currentStage'] = nextStage;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Stage set to $nextStage (Demo Mode)'),
          backgroundColor: AppColors.primary,
        ),
      );
    }
  }

  Widget _buildStaffChip(String role, String name, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.primary),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              '$role: $name',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecItem(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildChecklistTag(String text, bool isChecked) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isChecked ? Colors.green.shade50 : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: isChecked ? Colors.green.shade300 : Colors.grey.shade300),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isChecked ? Colors.green.shade800 : Colors.grey),
      ),
    );
  }

  Widget _buildMediaTile(String title, String subtitle, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: color)),
                Text(subtitle, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatPill(String label, String value, {bool isHighlight = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: isHighlight ? AppColors.error : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildTimelineStep(int stepNum, String title, String stageKey, String currentStage, String detail, {bool isLast = false}) {
    final stages = AppConstants.jobStages;
    final currentIndex = stages.indexOf(currentStage);
    final stepIndex = stages.indexOf(stageKey);

    final isCompleted = currentIndex > stepIndex || (currentIndex == stepIndex && currentStage == 'DELIVERED');
    final isCurrent = currentIndex == stepIndex && currentStage != 'DELIVERED';

    Color dotColor = AppColors.border;
    if (isCompleted) dotColor = AppColors.success;
    if (isCurrent) dotColor = AppColors.accent;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: isCompleted ? AppColors.success : (isCurrent ? AppColors.accent : Colors.white),
                shape: BoxShape.circle,
                border: Border.all(color: dotColor, width: 2),
              ),
              child: Center(
                child: isCompleted
                    ? const Icon(Icons.check, size: 14, color: Colors.white)
                    : Text(
                        '$stepNum',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isCurrent ? Colors.white : AppColors.textSecondary,
                        ),
                      ),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 36,
                color: isCompleted ? AppColors.success : AppColors.border,
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isCurrent || isCompleted ? FontWeight.bold : FontWeight.normal,
                        color: isCompleted
                            ? AppColors.success
                            : (isCurrent ? AppColors.primary : AppColors.textSecondary),
                      ),
                    ),
                    if (isCurrent)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.accent.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('In Progress', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.accent)),
                      ),
                  ],
                ),
                Text(
                  detail,
                  style: TextStyle(fontSize: 11, color: isCurrent ? AppColors.textPrimary : AppColors.textMuted),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showQrModal(String qrToken) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Job Card QR: ${_job['jobCode'] ?? 'JB-2026-0001'}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 16),
            QrImageView(
              data: qrToken,
              version: QrVersions.auto,
              size: 190.0,
              eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: AppColors.primary),
              dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: AppColors.primary),
            ),
            const SizedBox(height: 12),
            const Text(
              'Print and stick this QR on fabric & acrylic frames.\nOperators scan in 1 second to automatically advance stage.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }

  void _shareTrackingLink(String trackingToken) {
    final url = '${ApiClient.baseUrl.replaceAll('/api/v1', '')}/tracking/$trackingToken';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.share, color: AppColors.primary),
            SizedBox(width: 8),
            Text('Customer Tracking Link'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Customers can track live progress with zero login required:',
              style: TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 10),
            SelectableText(
              url,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.accent),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            icon: const Icon(Icons.open_in_browser, size: 16),
            label: const Text('Open Page'),
            onPressed: () {
              Navigator.pop(ctx);
              _launchUrl(url);
            },
          ),
        ],
      ),
    );
  }

  void _launchCaller(String phone) async {
    final uri = Uri.parse('tel:${phone.replaceAll(' ', '')}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
