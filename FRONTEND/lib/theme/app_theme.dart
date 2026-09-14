import 'package:flutter/material.dart';

class AppColors {
  // ------------------------------------------------------------
  // EXISTING COLORS
  // Keep these because other screens already use them.
  // ------------------------------------------------------------
  static const Color primaryOrange = Color(0xFFFF6B35);
  static const Color primaryGreen = Color(0xFF06D6A0);
  static const Color primaryBlue = Color(0xFF118AB2);
  static const Color primaryYellow = Color(0xFFFFD166);
  static const Color primaryPurple = Color(0xFF9B5DE5);
  static const Color primaryRed = Color(0xFFEF476F);

  // ------------------------------------------------------------
  // NEW APP BRAND COLORS
  // ------------------------------------------------------------
  static const Color brandGreen = Color(0xFF168A4A);
  static const Color darkGreen = Color(0xFF106B39);
  static const Color lightGreen = Color(0xFFE8F7EE);

  static const Color actionOrange = Color(0xFFF97316);
  static const Color lightOrange = Color(0xFFFFF1E8);

  // ------------------------------------------------------------
  // NEUTRAL COLORS
  // ------------------------------------------------------------
  static const Color background = Color(0xFFF6F8F7);
  static const Color cardBackground = Colors.white;

  static const Color textDark = Color(0xFF17211B);
  static const Color textLight = Color(0xFF66736A);
  static const Color textMuted = Color(0xFF98A29C);

  static const Color border = Color(0xFFE1E8E3);

  // ------------------------------------------------------------
  // STATUS COLORS
  // ------------------------------------------------------------
  static const Color success = Color(0xFF168A4A);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFDC2626);
}

class AppTheme {
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,

    scaffoldBackgroundColor: AppColors.background,

    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.brandGreen,
      brightness: Brightness.light,
    ),

    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: AppColors.textDark,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: AppColors.textDark,
        fontSize: 21,
        fontWeight: FontWeight.w700,
      ),
    ),

    cardTheme: CardThemeData(
      elevation: 0,
      color: AppColors.cardBackground,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(
          color: AppColors.border,
        ),
      ),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.brandGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        minimumSize: const Size(0, 52),
        padding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 14,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,

      contentPadding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 16,
      ),

      labelStyle: const TextStyle(
        color: AppColors.textLight,
      ),

      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(
          color: AppColors.border,
        ),
      ),

      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(
          color: AppColors.border,
        ),
      ),

      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(
          color: AppColors.brandGreen,
          width: 2,
        ),
      ),
    ),
  );
}