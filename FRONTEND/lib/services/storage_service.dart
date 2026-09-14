import 'package:hive_flutter/hive_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../models/scrap_transaction.dart';
import 'api_service.dart';

/// Single source of truth for transaction data on-device.
///
/// Design: EVERY write goes to Hive first (works with zero connectivity).
/// A transaction is only marked `synced = true` after the backend confirms
/// it. `syncPending()` is called on app start and whenever connectivity
/// is restored, so a 20kg-copper-recorded-offline case syncs automatically
/// the next time the phone gets signal.
class StorageService {
  static const String boxName = 'scrap_transactions';
  final ApiService _api = ApiService();

  Box<ScrapTransaction>? _box;

  Future<void> init() async {
    Hive.registerAdapter(ScrapTransactionAdapter());
    _box = await Hive.openBox<ScrapTransaction>(boxName);
    // Try an initial sync in case we're already online at launch.
    unawaited(syncPending());
  }

  Box<ScrapTransaction> get _requireBox {
    if (_box == null) {
      throw StateError('StorageService.init() must be called before use.');
    }
    return _box!;
  }

  /// Save locally immediately — never blocks on network.
  Future<void> saveTransaction(ScrapTransaction tx) async {
    await _requireBox.put(tx.id, tx);
    // Fire-and-forget attempt; if it's offline this just fails silently
    // and the record stays queued for the next sync pass.
    unawaited(_trySyncOne(tx));
  }

  List<ScrapTransaction> getAll() {
    return _requireBox.values.toList()
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
  }

  List<ScrapTransaction> getUnsynced() {
    return _requireBox.values.where((t) => !t.synced).toList();
  }

  double totalEarnings({bool paidOnly = false}) {
    return _requireBox.values
        .where((t) => !paidOnly || t.paymentStatus == 'paid')
        .fold(0.0, (sum, t) => sum + t.estimatedValue);
  }

  /// Called on connectivity-restored events and app start.
  Future<void> syncPending() async {
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.contains(ConnectivityResult.none)) return;

    for (final tx in getUnsynced()) {
      await _trySyncOne(tx);
    }
  }

  Future<void> _trySyncOne(ScrapTransaction tx) async {
    try {
      final success = await _api.uploadTransaction(tx);
      if (success) {
        tx.synced = true;
        await tx.save(); // HiveObject.save() persists the mutated record
      }
    } catch (_) {
      // Network unavailable or server error — leave it queued.
      // A future syncPending() call (e.g. on connectivity change) retries it.
    }
  }
}

// Small helper so we can "fire and forget" a Future without an analyzer
// warning, without pulling in dart:async's unawaited for older SDKs.
void unawaited(Future<void> future) {}
