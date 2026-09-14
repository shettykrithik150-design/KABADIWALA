import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:geolocator/geolocator.dart';

import '../main.dart';
import '../models/scrap_transaction.dart';
import '../theme/app_theme.dart';

class SellScrapScreen extends StatefulWidget {
  const SellScrapScreen({super.key});

  @override
  State<SellScrapScreen> createState() => _SellScrapScreenState();
}

class _SellScrapScreenState extends State<SellScrapScreen> {
  final _weightController = TextEditingController();

  String _material = 'Copper Cable';
  bool _saving = false;

  final _materials = const [
    'PCB',
    'Copper Cable',
    'Battery',
    'CRT Monitor',
    'LCD Screen',
    'Motor',
    'Plastic',
  ];

  final _pricePerKg = const {
    'PCB': 150.0,
    'Copper Cable': 480.0,
    'Battery': 90.0,
    'CRT Monitor': 20.0,
    'LCD Screen': 35.0,
    'Motor': 210.0,
    'Plastic': 12.0,
  };

  Future<void> _confirmHandover() async {
    final weight = double.tryParse(_weightController.text);

    if (weight == null || weight <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid weight.'),
        ),
      );
      return;
    }

    setState(() => _saving = true);

    // Location is best-effort.
    // Transaction can still be saved if GPS is unavailable.
    double? lat;
    double? lng;

    try {
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
      );

      lat = pos.latitude;
      lng = pos.longitude;
    } catch (_) {
      // GPS unavailable or permission denied.
    }

    final tx = ScrapTransaction(
      id: const Uuid().v4(),
      materialType: _material,
      weightKg: weight,
      estimatedValue: weight * (_pricePerKg[_material] ?? 0),
      latitude: lat,
      longitude: lng,
      timestamp: DateTime.now(),
    );

    // Offline-first storage remains unchanged.
    await storageService.saveTransaction(tx);

    if (!mounted) return;

    setState(() => _saving = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Transaction saved. ID: ${tx.id.substring(0, 8)}...',
        ),
      ),
    );

    Navigator.pushReplacementNamed(
      context,
      '/transactions',
    );
  }

  @override
  void dispose() {
    _weightController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final weight =
        double.tryParse(_weightController.text) ?? 0;

    final pricePerKg = _pricePerKg[_material] ?? 0;

    final estimate = weight * pricePerKg;

    return Scaffold(
      backgroundColor: AppColors.background,

      appBar: AppBar(
        title: const Text('Sell Scrap / बेचें'),
      ),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              // --------------------------------------------------
              // HEADER
              // --------------------------------------------------

              const Text(
                'Sell your scrap',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textDark,
                ),
              ),

              const SizedBox(height: 5),

              const Text(
                'Enter the material and approximate weight to calculate its value.',
                style: TextStyle(
                  fontSize: 14,
                  height: 1.4,
                  color: AppColors.textLight,
                ),
              ),

              const SizedBox(height: 24),

              // --------------------------------------------------
              // MATERIAL
              // --------------------------------------------------

              const Text(
                'Material',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),

              const SizedBox(height: 8),

              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppColors.border,
                  ),
                ),
                child: DropdownButtonFormField<String>(
                  initialValue: _material,

                  decoration: const InputDecoration(
                    labelText: 'Material Type',
                  ),

                  icon: const Icon(
                    Icons.keyboard_arrow_down_rounded,
                  ),

                  items: _materials.map(
                    (material) {
                      return DropdownMenuItem<String>(
                        value: material,
                        child: Row(
                          children: [

                            Container(
                              width: 10,
                              height: 10,
                              decoration: const BoxDecoration(
                                color: AppColors.brandGreen,
                                shape: BoxShape.circle,
                              ),
                            ),

                            const SizedBox(width: 10),

                            Text(material),
                          ],
                        ),
                      );
                    },
                  ).toList(),

                  onChanged: (value) {
                    if (value == null) return;

                    setState(() {
                      _material = value;
                    });
                  },
                ),
              ),

              const SizedBox(height: 20),

              // --------------------------------------------------
              // WEIGHT
              // --------------------------------------------------

              const Text(
                'Weight',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),

              const SizedBox(height: 8),

              TextField(
                controller: _weightController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                onChanged: (_) => setState(() {}),

                decoration: const InputDecoration(
                  labelText: 'Approximate Weight',
                  hintText: 'e.g. 5.5',
                  suffixText: 'kg',
                  prefixIcon: Icon(
                    Icons.scale_outlined,
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // --------------------------------------------------
              // PRICE INFORMATION
              // --------------------------------------------------

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.lightGreen,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: AppColors.brandGreen.withValues(
                      alpha: 0.15,
                    ),
                  ),
                ),
                child: Row(
                  children: [

                    Container(
                      width: 46,
                      height: 46,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.currency_rupee_rounded,
                        color: AppColors.brandGreen,
                      ),
                    ),

                    const SizedBox(width: 12),

                    Expanded(
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [

                          const Text(
                            'Current rate',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textLight,
                              fontWeight: FontWeight.w600,
                            ),
                          ),

                          const SizedBox(height: 3),

                          Text(
                            '₹${pricePerKg.toStringAsFixed(0)} / kg',
                            style: const TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textDark,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // --------------------------------------------------
              // ESTIMATED VALUE
              // --------------------------------------------------

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.border,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    const Text(
                      'ESTIMATED VALUE',
                      style: TextStyle(
                        fontSize: 11,
                        letterSpacing: 1.1,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textMuted,
                      ),
                    ),

                    const SizedBox(height: 6),

                    Text(
                      '₹${estimate.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: AppColors.brandGreen,
                      ),
                    ),

                    const SizedBox(height: 5),

                    Text(
                      weight > 0
                          ? '${weight.toStringAsFixed(2)} kg × ₹${pricePerKg.toStringAsFixed(0)}/kg'
                          : 'Enter your weight to calculate the estimate',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textLight,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // --------------------------------------------------
              // OFFLINE NOTE
              // --------------------------------------------------

              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: AppColors.border,
                  ),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    Icon(
                      Icons.cloud_done_outlined,
                      size: 20,
                      color: AppColors.brandGreen,
                    ),

                    SizedBox(width: 10),

                    Expanded(
                      child: Text(
                        'Your transaction is saved on the device first and can sync when you are back online.',
                        style: TextStyle(
                          fontSize: 12,
                          height: 1.4,
                          color: AppColors.textLight,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // --------------------------------------------------
              // CONFIRM BUTTON
              // --------------------------------------------------

              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.actionOrange,
                    foregroundColor: Colors.white,
                  ),

                  onPressed: _saving
                      ? null
                      : _confirmHandover,

                  icon: _saving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2.5,
                          ),
                        )
                      : const Icon(
                          Icons.check_circle_outline_rounded,
                        ),

                  label: Text(
                    _saving
                        ? 'Saving...'
                        : 'Confirm Handover',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}