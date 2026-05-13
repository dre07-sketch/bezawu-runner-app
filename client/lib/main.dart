import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'utils/theme.dart';
import 'views/login_screen.dart';
import 'views/main_navigation.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>(create: (_) => AuthProvider()),
        ChangeNotifierProvider<ThemeProvider>(create: (_) => ThemeProvider()),
      ],
      builder: (context, child) {
        return const BezawRunnerApp();
      },
    ),
  );
}

class BezawRunnerApp extends StatelessWidget {
  const BezawRunnerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthProvider, ThemeProvider>(
      builder: (context, auth, themeProvider, _) {
        return MaterialApp(
          title: 'Bezaw Runner',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: themeProvider.themeMode,
          home: auth.isLoading
              ? const Scaffold(
                  body: Center(
                    child: CircularProgressIndicator(
                      color: AppTheme.primary,
                    ),
                  ),
                )
              : auth.isAuthenticated
                  ? const MainNavigation()
                  : const LoginScreen(),
        );
      },
    );
  }
}
