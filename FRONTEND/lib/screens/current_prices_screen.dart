import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class CurrentPricesScreen extends StatefulWidget {
  const CurrentPricesScreen({super.key});

  @override
  State<CurrentPricesScreen> createState() => _CurrentPricesScreenState();
}

class _CurrentPricesScreenState extends State<CurrentPricesScreen> {
  final ApiService _api = ApiService();

  late Future<List<Map<String, dynamic>>> _prices;

  final List<Color> _colorCycle = const [
    AppColors.brandGreen,
    AppColors.actionOrange,
    AppColors.primaryBlue,
    AppColors.primaryPurple,
    AppColors.primaryYellow,
    AppColors.primaryRed,
  ];

  @override
  void initState() {
    super.initState();
    _loadPrices();
  }

  void _loadPrices() {
    _prices = _api.getCurrentPrices();
  }

  Future<void> _refreshPrices() async {
    setState(() {
      _loadPrices();
    });

    await _prices;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Current Prices'),
        actions: [
          IconButton(
            onPressed: _refreshPrices,
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh prices',
          ),
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _prices,
        builder: (context, snapshot) {
          // Loading
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(
                color: AppColors.brandGreen,
              ),
            );
          }

          // Error
          if (snapshot.hasError) {
            return _buildErrorState();
          }

          final prices = snapshot.data ?? [];

          // Empty response
          if (prices.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            color: AppColors.brandGreen,
            onRefresh: _refreshPrices,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
              children: [
                _buildHeader(),
                const SizedBox(height: 20),
                _buildInfoCard(),
                const SizedBox(height: 24),

                Text(
                  'Today\'s Scrap Rates',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textDark,
                  ),
                ),

                const SizedBox(height: 6),

                Text(
                  'Current market rates for different scrap materials',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textLight,
                  ),
                ),

                const SizedBox(height: 16),

                ...List.generate(
                  prices.length,
                  (index) => _buildPriceCard(
                    prices[index],
                    _colorCycle[index % _colorCycle.length],
                  ),
                ),

                const SizedBox(height: 12),

                _buildDisclaimer(),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.lightGreen,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.currency_rupee_rounded,
                color: AppColors.brandGreen,
                size: 26,
              ),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Know your scrap value',
                    style: TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textDark,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Check the latest available rates before selling.',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textLight,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.brandGreen,
        borderRadius: BorderRadius.circular(18),
      ),
      child: const Row(
        children: [
          Icon(
            Icons.trending_up_rounded,
            color: Colors.white,
            size: 30,
          ),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Scrap prices at a glance',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Rates are shown per kilogram (kg).',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceCard(
    Map<String, dynamic> price,
    Color color,
  ) {
    final material = price['material']?.toString() ?? 'Unknown Material';
    final priceValue = price['pricePerKg'];

    String displayPrice;

    if (priceValue is num) {
      displayPrice = priceValue.toStringAsFixed(0);
    } else {
      displayPrice = priceValue?.toString() ?? '0';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.border,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.035),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Material icon
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              Icons.recycling_rounded,
              color: color,
              size: 27,
            ),
          ),

          const SizedBox(width: 14),

          // Material name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  material,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Current rate',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 10),

          // Price
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹$displayPrice',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
              const Text(
                'per kg',
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.textLight,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDisclaimer() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.lightOrange,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: AppColors.actionOrange.withValues(alpha: 0.25),
        ),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: AppColors.actionOrange,
            size: 20,
          ),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Scrap rates may vary depending on quality, quantity, location, and recycler.',
              style: TextStyle(
                fontSize: 12,
                height: 1.4,
                color: AppColors.textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.lightOrange,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.cloud_off_rounded,
                size: 38,
                color: AppColors.actionOrange,
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Unable to load prices',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please check your connection and try again.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textLight,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _loadPrices();
                });
              },
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brandGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.price_check_rounded,
              size: 50,
              color: AppColors.textMuted,
            ),
            const SizedBox(height: 16),
            const Text(
              'No prices available',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Current scrap prices are not available right now.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textLight,
              ),
            ),
          ],
        ),
      ),
    );
  }
}