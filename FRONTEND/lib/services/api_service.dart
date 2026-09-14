import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/scrap_transaction.dart';

/// Wraps every backend call the app needs. Swap `baseUrl` for your
/// real deployed backend once Member 2/3's API is ready.
class ApiService {
  static const String baseUrl = 'https://api.kabadiwala.example.com'; // TODO: replace

  Future<bool> uploadTransaction(ScrapTransaction tx) async {
    final response = await http.post(
      Uri.parse('$baseUrl/transactions'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'id': tx.id,
        'materialType': tx.materialType,
        'weightKg': tx.weightKg,
        'estimatedValue': tx.estimatedValue,
        'recyclerId': tx.recyclerId,
        'latitude': tx.latitude,
        'longitude': tx.longitude,
        'timestamp': tx.timestamp.toIso8601String(),
        'paymentStatus': tx.paymentStatus,
      }),
    ).timeout(const Duration(seconds: 10));
    return response.statusCode == 200 || response.statusCode == 201;
  }

  /// Classify a photographed scrap item and get an estimated value.
  /// Replace with a real call to your AI classification endpoint.
  Future<Map<String, dynamic>> classifyScrap(String imagePath) async {
    // Placeholder response until the AI model endpoint exists.
    await Future.delayed(const Duration(milliseconds: 600));
    return {
      'materialType': 'Copper Cable',
      'confidence': 0.87,
      'estimatedPricePerKg': 480.0,
    };
  }

  Future<List<Map<String, dynamic>>> getCurrentPrices() async {
    final response = await http.get(Uri.parse('$baseUrl/prices'));
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    }
    // Fallback static prices so the screen still works offline/demo mode.
    return [
      {'material': 'PCB', 'pricePerKg': 150.0},
      {'material': 'Copper Cable', 'pricePerKg': 480.0},
      {'material': 'Battery', 'pricePerKg': 90.0},
      {'material': 'CRT Monitor', 'pricePerKg': 20.0},
      {'material': 'LCD Screen', 'pricePerKg': 35.0},
      {'material': 'Motor', 'pricePerKg': 210.0},
      {'material': 'Plastic', 'pricePerKg': 12.0},
    ];
  }

  Future<List<Map<String, dynamic>>> getNearbyRecyclers(
      double lat, double lng) async {
    final response =
        await http.get(Uri.parse('$baseUrl/recyclers?lat=$lat&lng=$lng'));
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    }
    return [];
  }
}
