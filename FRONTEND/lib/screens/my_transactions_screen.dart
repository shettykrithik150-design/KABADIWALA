import 'package:flutter/material.dart';
import '../main.dart';
import '../theme/app_theme.dart';

class MyTransactionsScreen extends StatefulWidget {
  const MyTransactionsScreen({super.key});

  @override
  State<MyTransactionsScreen> createState() => _MyTransactionsScreenState();
}

class _MyTransactionsScreenState extends State<MyTransactionsScreen> {
  bool _syncing = false;

  Future<void> _syncTransactions() async {
    if (_syncing) return;

    setState(() {
      _syncing = true;
    });

    try {
      await storageService.syncPending();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Transactions synced successfully'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unable to sync transactions.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _syncing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final transactions = storageService.getAll();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Transactions'),
        actions: [
          IconButton(
            onPressed: _syncing ? null : _syncTransactions,
            tooltip: 'Sync transactions',
            icon: _syncing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.brandGreen,
                    ),
                  )
                : const Icon(Icons.sync_rounded),
          ),
        ],
      ),
      body: transactions.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              color: AppColors.brandGreen,
              onRefresh: _syncTransactions,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
                children: [
                  _buildSummaryCard(transactions),
                  const SizedBox(height: 24),

                  const Text(
                    'Transaction History',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textDark,
                    ),
                  ),

                  const SizedBox(height: 6),

                  Text(
                    '${transactions.length} transaction${transactions.length == 1 ? '' : 's'} recorded',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textLight,
                    ),
                  ),

                  const SizedBox(height: 16),

                  ...List.generate(
                    transactions.length,
                    (index) => _buildTransactionCard(transactions[index]),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildSummaryCard(List transactions) {
    double totalValue = 0;
    double totalWeight = 0;

    for (final transaction in transactions) {
      totalValue += transaction.estimatedValue;
      totalWeight += transaction.weightKg;
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.brandGreen,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.receipt_long_rounded,
                color: Colors.white,
                size: 25,
              ),
              SizedBox(width: 10),
              Text(
                'Your Scrap Activity',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          Row(
            children: [
              Expanded(
                child: _buildSummaryItem(
                  'Transactions',
                  '${transactions.length}',
                  Icons.swap_horiz_rounded,
                ),
              ),
              Container(
                width: 1,
                height: 45,
                color: Colors.white.withValues(alpha: 0.25),
              ),
              Expanded(
                child: _buildSummaryItem(
                  'Total Weight',
                  '${totalWeight.toStringAsFixed(1)} kg',
                  Icons.scale_rounded,
                ),
              ),
              Container(
                width: 1,
                height: 45,
                color: Colors.white.withValues(alpha: 0.25),
              ),
              Expanded(
                child: _buildSummaryItem(
                  'Value',
                  '₹${totalValue.toStringAsFixed(0)}',
                  Icons.currency_rupee_rounded,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(
    String label,
    String value,
    IconData icon,
  ) {
    return Column(
      children: [
        Icon(
          icon,
          color: Colors.white70,
          size: 19,
        ),
        const SizedBox(height: 6),
        Text(
          value,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 15,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  Widget _buildTransactionCard(dynamic transaction) {
    final synced = transaction.synced;

    final statusColor =
        synced ? AppColors.brandGreen : AppColors.actionOrange;

    final statusBackground =
        synced ? AppColors.lightGreen : AppColors.lightOrange;

    final date =
        '${transaction.timestamp.toLocal()}'.split('.').first;

    final material = transaction.materialType.toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
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
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Scrap icon
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.lightGreen,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.recycling_rounded,
                  color: AppColors.brandGreen,
                  size: 27,
                ),
              ),

              const SizedBox(width: 14),

              // Transaction details
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
                        fontWeight: FontWeight.w800,
                        color: AppColors.textDark,
                      ),
                    ),

                    const SizedBox(height: 5),

                    Row(
                      children: [
                        const Icon(
                          Icons.scale_rounded,
                          size: 14,
                          color: AppColors.textMuted,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${transaction.weightKg} kg',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textLight,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 8),

              // Estimated value
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '₹${transaction.estimatedValue.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: AppColors.brandGreen,
                    ),
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'estimated',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 15),

          Container(
            height: 1,
            color: AppColors.border,
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              // Date
              const Icon(
                Icons.access_time_rounded,
                size: 15,
                color: AppColors.textMuted,
              ),
              const SizedBox(width: 5),

              Expanded(
                child: Text(
                  date,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textLight,
                  ),
                ),
              ),

              // Payment status
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 9,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  transaction.paymentStatus.toString(),
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textLight,
                  ),
                ),
              ),

              const SizedBox(width: 8),

              // Sync status
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 9,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: statusBackground,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      synced
                          ? Icons.cloud_done_rounded
                          : Icons.cloud_upload_rounded,
                      size: 13,
                      color: statusColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      synced ? 'Synced' : 'Pending',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
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
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: AppColors.lightGreen,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.receipt_long_rounded,
                size: 45,
                color: AppColors.brandGreen,
              ),
            ),

            const SizedBox(height: 20),

            const Text(
              'No transactions yet',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppColors.textDark,
              ),
            ),

            const SizedBox(height: 8),

            const Text(
              'Your scrap selling history will appear here once you complete your first transaction.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                height: 1.45,
                color: AppColors.textLight,
              ),
            ),

            const SizedBox(height: 22),

            ElevatedButton.icon(
              onPressed: () {
                Navigator.pushNamed(context, '/sell');
              },
              icon: const Icon(Icons.recycling_rounded),
              label: const Text('Sell Scrap'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brandGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 22,
                  vertical: 13,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}