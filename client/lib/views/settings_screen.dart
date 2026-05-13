import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../utils/theme.dart';
import 'financial_settings_screen.dart';
import 'profile_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'SETTINGS',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 1),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Appearance Section
            _buildSectionHeader('APPEARANCE'),
            _buildSettingTile(
              icon: isDark ? LucideIcons.moon : LucideIcons.sun,
              title: 'Dark Mode',
              subtitle: isDark ? 'Currently enabled' : 'Currently disabled',
              trailing: Switch(
                value: isDark,
                onChanged: (val) => themeProvider.toggleTheme(val),
                activeColor: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 32),

            // Account Section
            _buildSectionHeader('ACCOUNT'),
            _buildSettingTile(
              icon: LucideIcons.user,
              title: 'Profile Settings',
              subtitle: 'Update name, phone and image',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ProfileScreen()),
                );
              },
            ),
            _buildSettingTile(
              icon: LucideIcons.creditCard,
              title: 'Financial Settings',
              subtitle: 'Manage your bank details',
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const FinancialSettingsScreen()),
                );
              },
            ),
            const SizedBox(height: 32),

            // Danger Zone
            _buildSectionHeader('DANGER ZONE'),
            _buildSettingTile(
              icon: LucideIcons.logOut,
              title: 'Logout',
              subtitle: 'Sign out of your account',
              textColor: Colors.red,
              iconColor: Colors.red,
              onTap: () {
                _showLogoutDialog(context, auth);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w900,
          color: Colors.grey.withOpacity(0.8),
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? trailing,
    VoidCallback? onTap,
    Color? textColor,
    Color? iconColor,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.grey.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: (iconColor ?? AppTheme.primary).withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 20, color: iconColor ?? AppTheme.primary),
        ),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 16,
            color: textColor,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey.withOpacity(0.7),
            fontWeight: FontWeight.w500,
          ),
        ),
        trailing: trailing ?? Icon(LucideIcons.chevronRight, size: 18, color: Colors.grey.withOpacity(0.5)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, AuthProvider auth) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout', style: TextStyle(fontWeight: FontWeight.w900)),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.grey)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              auth.logout();
              // The Consumer in main.dart will automatically switch to LoginScreen
              // as soon as isAuthenticated becomes false.
            },
            child: const Text('LOGOUT', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.red)),
          ),
        ],
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      ),
    );
  }
}
