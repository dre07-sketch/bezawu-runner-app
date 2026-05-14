
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color primary = Color(0xFF10B981);
  static const Color backgroundLight = Colors.white; // Pure white as requested
  static const Color backgroundDark = Color(0xFF010F0A); // Very dark green/black
  static const Color surfaceLight = Colors.white;
  static const Color surfaceDark = Color(0xFF0D1F14); // Dark forest green surface
  static const Color brandDark = Color(0xFF064E3B);
  
  static const String imageBaseUrl = 'https://branchapi.bezawcurbside.com';
  static const String runnerImageBaseUrl = 'https://runnerapi.bezawcurbside.com';
  
  static const String eagleSoundPath = 'assets/eagle_sound.mp3';
  
  static String formatImageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    
    // Remove leading slash if present
    String cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Ensure the path is properly URL encoded but preserves slashes
    String encodedPath = cleanPath.split('/').map((s) => Uri.encodeComponent(s)).join('/');
    
    return '$imageBaseUrl/$encodedPath';
  }
  
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      brightness: Brightness.light,
      primary: primary,
      surface: surfaceLight,
    ),
    scaffoldBackgroundColor: backgroundLight,
    cardTheme: CardThemeData(
      color: surfaceLight,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
    ),
    textTheme: GoogleFonts.outfitTextTheme(),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
    ),
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      brightness: Brightness.dark,
      surface: surfaceDark,
    ),
    scaffoldBackgroundColor: backgroundDark,
    cardColor: surfaceDark,
    cardTheme: CardThemeData(
      color: surfaceDark,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
    ),
    textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
    ),
  );
}
