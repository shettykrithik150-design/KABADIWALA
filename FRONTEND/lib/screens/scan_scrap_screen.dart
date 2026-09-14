import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../services/api_service.dart';
import '../theme/app_theme.dart';

class ScanScrapScreen extends StatefulWidget {
  const ScanScrapScreen({super.key});

  @override
  State<ScanScrapScreen> createState() => _ScanScrapScreenState();
}

class _ScanScrapScreenState extends State<ScanScrapScreen> {
  final ApiService _api = ApiService();

  File? _image;
  Map<String, dynamic>? _result;
  bool _loading = false;

  Future<void> _capture() async {
    final picked = await ImagePicker().pickImage(
      source: ImageSource.camera,
      imageQuality: 80,
    );

    if (picked == null) return;

    setState(() {
      _image = File(picked.path);
      _loading = true;
      _result = null;
    });

    final result = await _api.classifyScrap(picked.path);

    if (!mounted) return;

    setState(() {
      _result = result;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,

      appBar: AppBar(
        title: const Text('Scan Scrap / स्कैन करें'),
      ),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              // ----------------------------------------------------
              // HEADER
              // ----------------------------------------------------

              const Text(
                'Identify your scrap',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textDark,
                ),
              ),

              const SizedBox(height: 5),

              const Text(
                'Take a clear photo and let us identify the material.',
                style: TextStyle(
                  fontSize: 14,
                  height: 1.4,
                  color: AppColors.textLight,
                ),
              ),

              const SizedBox(height: 18),

              // ----------------------------------------------------
              // IMAGE AREA
              // ----------------------------------------------------

              AspectRatio(
                aspectRatio: 1,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: _image != null
                          ? AppColors.brandGreen
                          : AppColors.border,
                      width: _image != null ? 2 : 1,
                    ),
                  ),
                  child: _image != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(20),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [

                              Image.file(
                                _image!,
                                fit: BoxFit.cover,
                              ),

                              // Small "Captured" badge
                              Positioned(
                                top: 12,
                                left: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 11,
                                    vertical: 7,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(
                                      alpha: 0.60,
                                    ),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.check_circle,
                                        color: Colors.white,
                                        size: 15,
                                      ),
                                      SizedBox(width: 5),
                                      Text(
                                        'Photo captured',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )
                      : _emptyScanState(),
                ),
              ),

              const SizedBox(height: 16),

              // ----------------------------------------------------
              // CAMERA BUTTON
              // ----------------------------------------------------

              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: _loading ? null : _capture,
                  icon: const Icon(
                    Icons.camera_alt_rounded,
                    size: 21,
                  ),
                  label: const Text(
                    'Take Photo / फोटो लें',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 10),

              const Center(
                child: Text(
                  'For best results, keep the scrap clearly visible.',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textMuted,
                  ),
                ),
              ),

              // ----------------------------------------------------
              // LOADING
              // ----------------------------------------------------

              if (_loading) ...[
                const SizedBox(height: 28),

                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.lightGreen,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: AppColors.brandGreen.withValues(
                        alpha: 0.15,
                      ),
                    ),
                  ),
                  child: const Column(
                    children: [
                      SizedBox(
                        width: 30,
                        height: 30,
                        child: CircularProgressIndicator(
                          strokeWidth: 3,
                          color: AppColors.brandGreen,
                        ),
                      ),

                      SizedBox(height: 14),

                      Text(
                        'Analyzing your scrap...',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textDark,
                        ),
                      ),

                      SizedBox(height: 5),

                      Text(
                        'Please wait while we identify the material.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.textLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              // ----------------------------------------------------
              // RESULT
              // ----------------------------------------------------

              if (_result != null) ...[
                const SizedBox(height: 28),

                _buildResultCard(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ==============================================================
  // EMPTY SCAN AREA
  // ==============================================================

  Widget _emptyScanState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [

            Container(
              width: 76,
              height: 76,
              decoration: const BoxDecoration(
                color: AppColors.lightGreen,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.document_scanner_rounded,
                size: 38,
                color: AppColors.brandGreen,
              ),
            ),

            const SizedBox(height: 16),

            const Text(
              'No photo yet',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),

            const SizedBox(height: 6),

            const Text(
              'Place your scrap in view and take a photo.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: AppColors.textLight,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==============================================================
  // RESULT CARD
  // ==============================================================

  Widget _buildResultCard() {
    final material = '${_result!['materialType']}';

    final confidenceValue = _result!['confidence'];

    double confidence = 0;

    if (confidenceValue is num) {
      confidence = confidenceValue.toDouble();
    }

    final confidencePercent = (confidence * 100).clamp(0, 100);

    final estimatedPrice =
        '${_result!['estimatedPricePerKg']}';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: AppColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          // --------------------------------------------------------
          // RESULT HEADER
          // --------------------------------------------------------

          Row(
            children: [

              Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  color: AppColors.lightGreen,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: AppColors.brandGreen,
                  size: 27,
                ),
              ),

              const SizedBox(width: 12),

              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Scan complete',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.brandGreen,
                        fontWeight: FontWeight.w700,
                      ),
                    ),

                    SizedBox(height: 2),

                    Text(
                      'Material identified',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textDark,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // --------------------------------------------------------
          // MATERIAL
          // --------------------------------------------------------

          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                const Text(
                  'MATERIAL',
                  style: TextStyle(
                    fontSize: 11,
                    letterSpacing: 1,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textMuted,
                  ),
                ),

                const SizedBox(height: 5),

                Text(
                  material,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textDark,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // --------------------------------------------------------
          // CONFIDENCE + PRICE
          // --------------------------------------------------------

          Row(
            children: [

              Expanded(
                child: _infoBox(
                  icon: Icons.verified_outlined,
                  label: 'Confidence',
                  value: '${confidencePercent.toStringAsFixed(0)}%',
                  color: AppColors.brandGreen,
                ),
              ),

              const SizedBox(width: 12),

              Expanded(
                child: _infoBox(
                  icon: Icons.currency_rupee_rounded,
                  label: 'Est. Price',
                  value: '₹$estimatedPrice/kg',
                  color: AppColors.actionOrange,
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // --------------------------------------------------------
          // PROCEED BUTTON
          // --------------------------------------------------------

          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.actionOrange,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.pushNamed(
                  context,
                  '/sell',
                  arguments: _result,
                );
              },
              icon: const Icon(
                Icons.arrow_forward_rounded,
              ),
              label: const Text(
                'Proceed to Sell',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==============================================================
  // INFO BOX
  // ==============================================================

  Widget _infoBox({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withValues(alpha: 0.14),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          Row(
            children: [
              Icon(
                icon,
                size: 18,
                color: color,
              ),

              const SizedBox(width: 6),

              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textLight,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 7),

          Text(
            value,
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}