import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_theme.dart';
import '../widgets/category_card.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final unsyncedCount = storageService.getUnsynced().length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Kabadiwala'),
        actions: [
          if (unsyncedCount > 0)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.lightOrange,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.cloud_off_rounded,
                        size: 16,
                        color: AppColors.actionOrange,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        '$unsyncedCount pending',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.actionOrange,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),

      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        children: [

          // --------------------------------------------------------
          // GREETING
          // --------------------------------------------------------

          const Text(
            'Hello 👋',
            style: TextStyle(
              color: AppColors.textLight,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),

          const SizedBox(height: 4),

          const Text(
            'Turn your scrap into value.',
            style: TextStyle(
              color: AppColors.textDark,
              fontSize: 25,
              fontWeight: FontWeight.w800,
            ),
          ),

          const SizedBox(height: 20),

          // --------------------------------------------------------
          // MAIN SCAN CARD
          // --------------------------------------------------------

          Material(
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(24),
            child: InkWell(
              onTap: () {
                Navigator.pushNamed(context, '/scan');
              },
              borderRadius: BorderRadius.circular(24),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      AppColors.brandGreen,
                      AppColors.darkGreen,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.brandGreen.withValues(alpha: 0.20),
                      blurRadius: 18,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),

                child: Row(
                  children: [

                    Expanded(
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [

                          const Text(
                            'Scan your scrap',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                            ),
                          ),

                          const SizedBox(height: 6),

                          Text(
                            'Identify the material and get an instant estimate.',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.82),
                              fontSize: 14,
                              height: 1.4,
                            ),
                          ),

                          const SizedBox(height: 16),

                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.camera_alt_rounded,
                                  size: 18,
                                  color: AppColors.brandGreen,
                                ),
                                SizedBox(width: 7),
                                Text(
                                  'Scan Now',
                                  style: TextStyle(
                                    color: AppColors.brandGreen,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(width: 12),

                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.14),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.document_scanner_rounded,
                        color: Colors.white,
                        size: 34,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 28),

          // --------------------------------------------------------
          // QUICK ACTIONS
          // --------------------------------------------------------

          const Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppColors.textDark,
            ),
          ),

          const SizedBox(height: 12),

          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),

            children: [

              CategoryCard(
                title: 'Sell Scrap',
                icon: Icons.sell_outlined,
                color: AppColors.brandGreen,
                onTap: () {
                  Navigator.pushNamed(context, '/sell');
                },
              ),

              CategoryCard(
                title: 'Current Prices',
                icon: Icons.price_change_outlined,
                color: AppColors.actionOrange,
                onTap: () {
                  Navigator.pushNamed(context, '/prices');
                },
              ),

              CategoryCard(
                title: 'Nearby Recyclers',
                icon: Icons.location_on_outlined,
                color: AppColors.primaryBlue,
                onTap: () {
                  Navigator.pushNamed(context, '/recyclers');
                },
              ),

              CategoryCard(
                title: 'My Transactions',
                icon: Icons.receipt_long_outlined,
                color: AppColors.primaryPurple,
                onTap: () {
                  Navigator.pushNamed(context, '/transactions');
                },
              ),
            ],
          ),

          const SizedBox(height: 12),

          CategoryCard(
            title: 'My Earnings',
            icon: Icons.account_balance_wallet_outlined,
            color: AppColors.primaryGreen,
            onTap: () {
              Navigator.pushNamed(context, '/earnings');
            },
          ),
        ],
      ),
    );
  }
}