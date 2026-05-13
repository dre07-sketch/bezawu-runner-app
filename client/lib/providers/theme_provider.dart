import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider with ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;
  static const String _themeKey = 'theme_mode';

  ThemeProvider() {
    _loadTheme();
  }

  ThemeMode get themeMode => _themeMode;

  bool get isDarkMode => _themeMode == ThemeMode.dark;

  Future<void> toggleTheme(bool isDark) async {
    _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, _themeMode.toString());
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final themeStr = prefs.getString(_themeKey);
    if (themeStr != null) {
      _themeMode = ThemeMode.values.firstWhere(
        (e) => e.toString() == themeStr,
        orElse: () => ThemeMode.system,
      );
      notifyListeners();
    }
  }
}
