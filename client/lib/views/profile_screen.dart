
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../utils/theme.dart';
import '../widgets/bezaw_image.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _apiService = ApiService();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _imageUrlController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isChangingPassword = false;
  bool _isUploadingImage = false;
  String? _error;
  String? _success;
  String? _passwordError;
  String? _passwordSuccess;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void initState() {
    super.initState();
    _imageUrlController.addListener(() {
      setState(() {}); // Refresh preview when URL changes
    });
    _fetchProfile();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _imageUrlController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _fetchProfile() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final profile = await _apiService.getProfile();
      final data = profile['data'];
      if (data != null) {
        setState(() {
          _nameController.text = data['name'] ?? '';
          _phoneController.text = data['phone'] ?? '';
          _imageUrlController.text = data['pro_image'] ?? '';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _handleSave() async {
    setState(() {
      _isSaving = true;
      _error = null;
      _success = null;
    });

    try {
      await _apiService.updateProfile({
        'name': _nameController.text,
        'phone': _phoneController.text,
        'pro_image': _imageUrlController.text,
      });
      
      // Refresh local user data in provider
      final auth = Provider.of<AuthProvider>(context, listen: false);
      await auth.refreshUser();

      setState(() {
        _success = 'Profile updated successfully!';
        _isSaving = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('EDIT PROFILE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 1)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  // Profile Image Edit
                  _buildImageSection(isDark),
                  const SizedBox(height: 40),
                  
                  if (_error != null) _buildAlert(_error!, isError: true),
                  if (_success != null) _buildAlert(_success!, isError: false),

                  _buildTextField('Full Name', _nameController, LucideIcons.user),
                  const SizedBox(height: 20),
                  _buildTextField('Phone Number', _phoneController, LucideIcons.phone),
                  
                  const SizedBox(height: 48),
                  
                  _buildSaveButton(),
                  
                  const SizedBox(height: 60),
                  const Divider(height: 1, thickness: 1),
                  const SizedBox(height: 40),
                  
                  _buildPasswordSection(isDark),
                ],
              ),
            ),
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isSaving ? null : _handleSave,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          elevation: 0,
        ),
        child: _isSaving
            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Text('SAVE CHANGES', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
      ),
    );
  }

  Widget _buildPasswordSection(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('SECURITY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 1.5, color: AppTheme.primary)),
        const SizedBox(height: 24),
        
        if (_passwordError != null) _buildAlert(_passwordError!, isError: true),
        if (_passwordSuccess != null) _buildAlert(_passwordSuccess!, isError: false),

        _buildTextField('New Password', _newPasswordController, LucideIcons.lock, isPassword: true, obscureText: _obscureNewPassword, onToggle: () => setState(() => _obscureNewPassword = !_obscureNewPassword)),
        const SizedBox(height: 20),
        _buildTextField('Confirm New Password', _confirmPasswordController, LucideIcons.lock, isPassword: true, obscureText: _obscureConfirmPassword, onToggle: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword)),
        
        const SizedBox(height: 32),
        
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isChangingPassword ? null : _handleChangePassword,
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 20),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              side: BorderSide(color: isDark ? Colors.white24 : Colors.grey[300]!),
            ),
            child: _isChangingPassword
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))
                : const Text('UPDATE PASSWORD', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1, color: AppTheme.primary)),
          ),
        ),
      ],
    );
  }

  Future<void> _handleChangePassword() async {
    if (_newPasswordController.text != _confirmPasswordController.text) {
      setState(() => _passwordError = 'Passwords do not match');
      return;
    }

    setState(() {
      _isChangingPassword = true;
      _passwordError = null;
      _passwordSuccess = null;
    });

    try {
      await _apiService.changePassword(
        _newPasswordController.text,
      );
      
      setState(() {
        _passwordSuccess = 'Password updated successfully!';
        _newPasswordController.clear();
        _confirmPasswordController.clear();
        _isChangingPassword = false;
      });
    } catch (e) {
      setState(() {
        _passwordError = e.toString().replaceFirst('Exception: ', '');
        _isChangingPassword = false;
      });
    }
  }

  Widget _buildImageSection(bool isDark) {
    return Center(
      child: GestureDetector(
        onTap: _isUploadingImage ? null : _pickAndUploadImage,
        child: Stack(
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: isDark ? Colors.white10 : Colors.grey[100],
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.primary.withOpacity(0.2), width: 4),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(100),
                child: _isUploadingImage
                  ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                  : BezawImage(
                      imagePath: _imageUrlController.text,
                      fit: BoxFit.cover,
                      placeholder: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                      errorWidget: const Icon(LucideIcons.user, size: 48, color: Colors.grey),
                    ),
              ),
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: AppTheme.primary,
                  shape: BoxShape.circle,
                ),
                child: _isUploadingImage 
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(LucideIcons.camera, color: Colors.white, size: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickAndUploadImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1000,
      maxHeight: 1000,
      imageQuality: 85,
    );

    if (image == null) return;

    setState(() {
      _isUploadingImage = true;
      _error = null;
    });

    try {
      final newUrl = await _apiService.uploadProfileImage(image.path);
      setState(() {
        _imageUrlController.text = newUrl;
        _isUploadingImage = false;
        _success = 'Profile image updated!';
      });
      
      // Refresh local user data and header
      final auth = Provider.of<AuthProvider>(context, listen: false);
      await auth.refreshUser();
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _isUploadingImage = false;
      });
    }
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, {bool isPassword = false, bool obscureText = false, VoidCallback? onToggle}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.2)),
        ),
        TextField(
          controller: controller,
          obscureText: isPassword ? obscureText : false,
          style: const TextStyle(fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, size: 18, color: AppTheme.primary),
            suffixIcon: isPassword ? IconButton(
              icon: Icon(obscureText ? LucideIcons.eye : LucideIcons.eyeOff, size: 18, color: Colors.grey),
              onPressed: onToggle,
            ) : null,
            filled: true,
            fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: const BorderSide(color: AppTheme.primary, width: 2)),
          ),
        ),
      ],
    );
  }

  Widget _buildAlert(String msg, {required bool isError}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isError ? Colors.red.withOpacity(0.1) : AppTheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Icon(isError ? LucideIcons.alertCircle : LucideIcons.checkCircle, color: isError ? Colors.red : AppTheme.primary, size: 16),
          const SizedBox(width: 12),
          Expanded(child: Text(msg, style: TextStyle(color: isError ? Colors.red : AppTheme.primary, fontSize: 13, fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }
}
