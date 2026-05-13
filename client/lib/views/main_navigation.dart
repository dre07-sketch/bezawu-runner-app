
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_nav_bar/google_nav_bar.dart';
import 'dashboard_screen.dart';
import 'history_screen.dart';
import 'wallet_screen.dart';
import 'settings_screen.dart';
import '../utils/theme.dart';
import 'dart:ui';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const HistoryScreen(),
    const WalletScreen(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      extendBody: true,
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: _buildPremiumNavBar(isDark),
    );
  }

  Widget _buildPremiumNavBar(bool isDark) {
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      decoration: BoxDecoration(
        color: isDark 
          ? const Color(0xFF0D1F14).withOpacity(0.85) 
          : Colors.white.withOpacity(0.85),
        borderRadius: BorderRadius.circular(35),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.05),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 30,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(35),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
            child: GNav(
              rippleColor: AppTheme.primary.withOpacity(0.1),
              hoverColor: AppTheme.primary.withOpacity(0.05),
              gap: 8,
              activeColor: Colors.white,
              iconSize: 24,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              duration: const Duration(milliseconds: 400),
              tabBackgroundColor: AppTheme.primary,
              color: isDark ? Colors.white60 : Colors.black45,
              tabs: const [
                GButton(
                  icon: LucideIcons.layoutGrid,
                  text: 'Home',
                ),
                GButton(
                  icon: LucideIcons.history,
                  text: 'History',
                ),
                GButton(
                  icon: LucideIcons.wallet,
                  text: 'Wallet',
                ),
                GButton(
                  icon: LucideIcons.user,
                  text: 'Profile',
                ),
              ],
              selectedIndex: _selectedIndex,
              onTabChange: (index) {
                setState(() {
                  _selectedIndex = index;
                });
              },
            ),
          ),
        ),
      ),
    );
  }
}
