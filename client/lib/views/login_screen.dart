
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import '../utils/theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

enum LoginStep { idEntry, passwordLogin, passwordSetup, forgotPasswordRequest, resetPassword }

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _idController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  
  LoginStep _currentStep = LoginStep.idEntry;
  bool _isLoading = false;
  String? _error;
  String? _success;
  String? _resetToken;
  String? _emailPreview;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _idController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _handleNext() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);

    try {
      if (_currentStep == LoginStep.idEntry) {
        final result = await auth.login(_idController.text.toUpperCase());
        if (result['requires_setup'] == true) {
          setState(() {
            _currentStep = LoginStep.passwordSetup;
          });
        }
      } else if (_currentStep == LoginStep.passwordLogin) {
        await auth.login(_idController.text.toUpperCase(), password: _passwordController.text);
      } else if (_currentStep == LoginStep.passwordSetup) {
        if (_passwordController.text != _confirmPasswordController.text) {
          throw Exception('Passwords do not match');
        }
        if (_passwordController.text.length < 6) {
          throw Exception('Password must be at least 6 characters');
        }
        await auth.setupPassword(_idController.text.toUpperCase(), _passwordController.text);
      } else if (_currentStep == LoginStep.forgotPasswordRequest) {
        final result = await auth.apiService.forgotPassword(_idController.text.toUpperCase());
        setState(() {
          _resetToken = result['token'];
          _emailPreview = result['email_preview'];
          _currentStep = LoginStep.resetPassword;
          _success = 'OTP sent to your email';
        });
      } else if (_currentStep == LoginStep.resetPassword) {
        if (_passwordController.text != _confirmPasswordController.text) {
          throw Exception('Passwords do not match');
        }
        if (_passwordController.text.length < 6) {
          throw Exception('Password must be at least 6 characters');
        }
        if (_otpController.text.length != 6) {
          throw Exception('Enter valid 6-digit OTP');
        }
        
        await auth.apiService.resetPassword(
          id: _idController.text.toUpperCase(),
          otp: _otpController.text,
          newPassword: _passwordController.text,
          token: _resetToken!,
        );

        setState(() {
          _success = 'Password reset successfully! Please login.';
          _currentStep = LoginStep.passwordLogin;
          _passwordController.clear();
          _confirmPasswordController.clear();
          _otpController.clear();
        });
      }
    } catch (e) {
      final msg = e.toString().replaceFirst('Exception: ', '');
      if (msg == 'Password is required') {
        setState(() {
          _currentStep = LoginStep.passwordLogin;
        });
      } else {
        setState(() {
          _error = msg;
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      body: Stack(
        children: [
          // Background blurry circles
          Positioned(
            top: -100,
            right: -50,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            left: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    children: [
                      // Logo Section
                      const SizedBox(height: 40),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: Image.asset(
                          'assets/photo_2026-05-13_16-08-06.jpg',
                          height: 96,
                          width: 96,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Bezaw Curbside',
                        style: GoogleFonts.inter(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : const Color(0xFF1E293B),
                        ),
                      ),
                      Text(
                        'Operations & Logistics Portal',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey,
                        ),
                      ),
                      
                      const SizedBox(height: 40),
                      
                      // Login Card
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.surfaceDark : Colors.white,
                          borderRadius: BorderRadius.circular(40),
                          border: Border.all(
                            color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 50,
                              offset: const Offset(0, 20),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getTitle(),
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _getSubtitle(),
                              style: const TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 32),
                            
                            if (_currentStep == LoginStep.idEntry)
                              _buildTextField(
                                label: 'Runner Identification',
                                controller: _idController,
                                icon: LucideIcons.smartphone,
                                placeholder: 'Enter your Runner ID',
                                uppercase: true,
                              ),
                              
                            if (_currentStep == LoginStep.passwordLogin) ...[
                              _buildTextField(
                                label: 'Password',
                                controller: _passwordController,
                                icon: LucideIcons.lock,
                                placeholder: 'Enter your password',
                                obscureText: _obscurePassword,
                                showToggle: true,
                                onToggleObscure: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _currentStep = LoginStep.forgotPasswordRequest;
                                    _error = null;
                                  });
                                },
                                child: const Text(
                                  'Forgot Password?',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primary,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _currentStep = LoginStep.idEntry;
                                    _passwordController.clear();
                                    _error = null;
                                  });
                                },
                                child: const Text(
                                  'Change Runner ID',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                            ],
                            
                            if (_currentStep == LoginStep.forgotPasswordRequest) ...[
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppTheme.primary.withOpacity(0.05),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(LucideIcons.mail, color: AppTheme.primary, size: 20),
                                    SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        'We will send a 6-digit OTP to your registered email to reset your password.',
                                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.grey),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _currentStep = LoginStep.passwordLogin;
                                    _error = null;
                                  });
                                },
                                child: const Text(
                                  'Back to Login',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                            ],

                            if (_currentStep == LoginStep.resetPassword) ...[
                              _buildTextField(
                                label: 'One-Time Password (OTP)',
                                controller: _otpController,
                                icon: LucideIcons.key,
                                placeholder: 'Enter 6-digit code',
                              ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                label: 'New Password',
                                controller: _passwordController,
                                icon: LucideIcons.lock,
                                placeholder: 'Min 6 characters',
                                obscureText: _obscurePassword,
                                showToggle: true,
                                onToggleObscure: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                label: 'Confirm New Password',
                                controller: _confirmPasswordController,
                                icon: LucideIcons.checkCircle,
                                placeholder: 'Repeat new password',
                                obscureText: _obscureConfirmPassword,
                                showToggle: true,
                                onToggleObscure: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                              ),
                              const SizedBox(height: 8),
                              TextButton(
                                onPressed: () {
                                  setState(() {
                                    _currentStep = LoginStep.forgotPasswordRequest;
                                    _error = null;
                                    _success = null;
                                  });
                                },
                                child: const Text(
                                  'Resend OTP',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primary,
                                  ),
                                ),
                              ),
                            ],
                            
                            if (_currentStep == LoginStep.passwordSetup) ...[
                              _buildTextField(
                                label: 'Create Password',
                                controller: _passwordController,
                                icon: LucideIcons.key,
                                placeholder: 'Min 6 characters',
                                obscureText: _obscurePassword,
                                showToggle: true,
                                onToggleObscure: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                label: 'Confirm Password',
                                controller: _confirmPasswordController,
                                icon: LucideIcons.lock,
                                placeholder: 'Confirm your password',
                                obscureText: _obscureConfirmPassword,
                                showToggle: true,
                                onToggleObscure: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                              ),
                            ],
                            
                            if (_error != null || _success != null) ...[
                              const SizedBox(height: 24),
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: (_error != null ? Colors.red : AppTheme.primary).withOpacity(0.05),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: (_error != null ? Colors.red : AppTheme.primary).withOpacity(0.1)),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      _error != null ? LucideIcons.alertCircle : LucideIcons.checkCircle,
                                      color: _error != null ? Colors.red : AppTheme.primary,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        _error ?? _success!,
                                        style: TextStyle(
                                          color: _error != null ? Colors.red : AppTheme.primary,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                            
                            const SizedBox(height: 32),
                            
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _isLoading ? null : _handleNext,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primary,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 18),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  elevation: 0,
                                ),
                                child: _isLoading
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            _currentStep == LoginStep.idEntry 
                                              ? 'Continue' 
                                              : _currentStep == LoginStep.forgotPasswordRequest
                                                ? 'Send OTP Code'
                                                : _currentStep == LoginStep.resetPassword
                                                  ? 'Reset Password'
                                                  : 'Secure Login',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          const Icon(LucideIcons.arrowRight, size: 18),
                                        ],
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 48),
                      
                      // Footer
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _buildFooterItem(LucideIcons.shieldCheck, 'Secure Access'),
                          const SizedBox(width: 24),
                          Container(width: 6, height: 6, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.2), shape: BoxShape.circle)),
                          const SizedBox(width: 24),
                          _buildFooterItem(LucideIcons.checkCircle, 'System Online'),
                        ],
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getTitle() {
    switch (_currentStep) {
      case LoginStep.idEntry: return 'Sign In';
      case LoginStep.passwordLogin: return 'Welcome Back';
      case LoginStep.passwordSetup: return 'Secure Your Account';
      case LoginStep.forgotPasswordRequest: return 'Forgot Password';
      case LoginStep.resetPassword: return 'Reset Password';
    }
  }

  String _getSubtitle() {
    switch (_currentStep) {
      case LoginStep.idEntry: return 'Enter your runner ID to continue';
      case LoginStep.passwordLogin: return 'Enter your password to access the dashboard';
      case LoginStep.passwordSetup: return 'Please create a new password for your account';
      case LoginStep.forgotPasswordRequest: return 'Request an OTP to reset your account';
      case LoginStep.resetPassword: return 'Enter the code sent to $_emailPreview';
    }
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    required String placeholder,
    bool obscureText = false,
    bool uppercase = false,
    bool showToggle = false,
    VoidCallback? onToggleObscure,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
              color: Colors.grey,
            ),
          ),
        ),
        TextField(
          controller: controller,
          obscureText: obscureText,
          onChanged: uppercase ? (val) {
            controller.value = controller.value.copyWith(
              text: val.toUpperCase(),
              selection: TextSelection.collapsed(offset: val.length),
            );
          } : null,
          style: const TextStyle(fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: TextStyle(color: Colors.grey.withOpacity(0.5)),
            prefixIcon: Padding(
              padding: const EdgeInsets.all(12),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 18, color: isDark ? Colors.grey : const Color(0xFF94A3B8)),
              ),
            ),
            suffixIcon: showToggle ? IconButton(
              icon: Icon(
                obscureText ? LucideIcons.eye : LucideIcons.eyeOff,
                size: 18,
                color: Colors.grey,
              ),
              onPressed: onToggleObscure,
            ) : null,
            filled: true,
            fillColor: isDark ? Colors.white.withOpacity(0.02) : const Color(0xFFF8FAFC),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFF1F5F9), width: 2),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppTheme.primary, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFooterItem(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppTheme.primary),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }
}
