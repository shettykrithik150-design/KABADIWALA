import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'services/storage_service.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/sell_scrap_screen.dart';
import 'screens/scan_scrap_screen.dart';
import 'screens/current_prices_screen.dart';
import 'screens/nearby_recyclers_screen.dart';
import 'screens/my_transactions_screen.dart';
import 'screens/earnings_screen.dart';

final storageService = StorageService();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  await storageService.init();

  // Auto-sync whenever connectivity is restored — this is what makes
  // "record offline, sync later" actually happen without user action.
  Connectivity().onConnectivityChanged.listen((_) {
    storageService.syncPending();
  });

  runApp(const KabadiwalaApp());
}

class KabadiwalaApp extends StatelessWidget {
  const KabadiwalaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kabadiwala',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: '/login',
      routes: {
        '/login': (_) => const LoginScreen(),
        '/home': (_) => const HomeScreen(),
        '/sell': (_) => const SellScrapScreen(),
        '/scan': (_) => const ScanScrapScreen(),
        '/prices': (_) => const CurrentPricesScreen(),
        '/recyclers': (_) => const NearbyRecyclersScreen(),
        '/transactions': (_) => const MyTransactionsScreen(),
        '/earnings': (_) => const EarningsScreen(),
      },
    );
  }
}