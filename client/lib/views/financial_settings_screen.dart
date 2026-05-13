
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/api_service.dart';
import '../utils/theme.dart';

class FinancialSettingsScreen extends StatefulWidget {
  const FinancialSettingsScreen({super.key});

  @override
  State<FinancialSettingsScreen> createState() => _FinancialSettingsScreenState();
}

class _FinancialSettingsScreenState extends State<FinancialSettingsScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _accountNumberController = TextEditingController();
  final TextEditingController _accountNameController = TextEditingController();
  
  List<dynamic> _banks = [];
  String? _selectedBankCode;
  bool _isLoading = true;
  bool _isSaving = false;
  bool _isEditing = false;
  bool _hasAccount = false;
  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _fetchBanks();
    await _fetchProfile();
  }

  Future<void> _fetchBanks() async {
    try {
      final res = await http.get(
        Uri.parse('https://api.chapa.co/v1/banks'),
        headers: {'Authorization': 'Bearer CHASECK_TEST-5uH9FB6K20dL31oDJnMvickJkHwaeUwh'}
      );
      final data = jsonDecode(res.body);
      if (data['data'] != null) {
        setState(() {
          _banks = data['data'];
          _banks.sort((a, b) => (a['name'] as String).compareTo(b['name'] as String));
        });
      }
    } catch (e) {
      setState(() {
        _banks = [
          {'id': 'cbebirr', 'name': 'CBEBirr'},
          {'id': 'telebirr', 'name': 'telebirr'},
          {'id': 'cbe', 'name': 'Commercial Bank of Ethiopia'},
          {'id': 'boa', 'name': 'Bank of Abyssinia'},
          {'id': 'awash', 'name': 'Awash Bank'},
          {'id': 'dashen', 'name': 'Dashen Bank'},
          {'id': 'coop', 'name': 'Cooperative Bank of Oromia'},
          {'id': 'nib', 'name': 'Nib International Bank'},
          {'id': 'zemen', 'name': 'Zemen Bank'},
        ];
      });
    }
  }

  Future<void> _fetchProfile() async {
    try {
      final profile = await _apiService.getProfile();
      final data = profile['data'];
      if (data != null && (data['account_number'] != null || data['bank_code'] != null)) {
        setState(() {
          _accountNumberController.text = data['account_number'] ?? '';
          _accountNameController.text = data['account_name'] ?? '';
          _selectedBankCode = data['bank_code'];
          _hasAccount = true;
          _isLoading = false;
        });
      } else {
        setState(() {
          _hasAccount = false;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _handleSave() async {
    if (_selectedBankCode == null || _accountNumberController.text.isEmpty || _accountNameController.text.isEmpty) {
      setState(() => _error = 'Please fill all fields');
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
      _success = null;
    });

    try {
      await _apiService.updateFinancialSettings({
        'bank_code': _selectedBankCode,
        'account_number': _accountNumberController.text,
        'account_name': _accountNameController.text,
      });
      await _fetchProfile();
      setState(() {
        _isEditing = false;
        _success = 'Account details saved successfully!';
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(LucideIcons.chevronLeft),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Payment Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            Text('Runner Settlement Account', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey.withOpacity(0.6), letterSpacing: 1)),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  if (_error != null) _buildAlert(_error!, isError: true),
                  if (_success != null) _buildAlert(_success!, isError: false),
                  
                  if (_hasAccount && !_isEditing) _buildViewMode(isDark)
                  else _buildEditMode(isDark),
                ],
              ),
            ),
    );
  }

  Widget _buildAlert(String msg, {required bool isError}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isError ? Colors.red.withOpacity(0.1) : AppTheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isError ? Colors.red.withOpacity(0.2) : AppTheme.primary.withOpacity(0.2)),
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

  Widget _buildViewMode(bool isDark) {
    final bankName = _banks.firstWhere((b) => b['id'] == _selectedBankCode, orElse: () => {'name': _selectedBankCode})['name'];

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.surfaceDark : Colors.white,
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: const Color(0xFF10B981), borderRadius: BorderRadius.circular(16)),
                        child: const Icon(LucideIcons.checkCircle2, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Account Connected', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                          Text('ACTIVE PAYOUT DESTINATION', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Color(0xFF10B981), letterSpacing: 1.5)),
                        ],
                      ),
                    ],
                  ),
                  InkWell(
                    onTap: () => setState(() => _isEditing = true),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text('Edit'.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _buildStaticField('BANK / PLATFORM', bankName, isDark),
              const SizedBox(height: 12),
              _buildStaticField('ACCOUNT / PHONE', _accountNumberController.text, isDark, isMono: true),
              const SizedBox(height: 12),
              _buildStaticField('ACCOUNT HOLDER NAME', _accountNameController.text, isDark),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStaticField(String label, String value, bool isDark, {bool isMono = false}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, fontFamily: isMono ? 'monospace' : null)),
        ],
      ),
    );
  }

  Widget _buildEditMode(bool isDark) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.05),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.primary.withOpacity(0.1)),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(LucideIcons.shieldCheck, color: AppTheme.primary, size: 24),
              SizedBox(width: 16),
              Expanded(
                child: Text(
                  'Please connect a bank account or Telebirr number. This is where your earnings and tips will be deposited.',
                  style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        
        _buildDropdown('Bank or Wallet'),
        const SizedBox(height: 20),
        _buildTextField('Account Number / Phone', _accountNumberController),
        const SizedBox(height: 20),
        _buildTextField('Legal Account Name', _accountNameController),
        
        const SizedBox(height: 40),
        
        Row(
          children: [
            if (_hasAccount)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: OutlinedButton(
                    onPressed: () => setState(() => _isEditing = false),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('CANCEL', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.grey)),
                  ),
                ),
              ),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _handleSave,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: _isSaving
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_hasAccount ? 'UPDATE ACCOUNT' : 'SAVE ACCOUNT', style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDropdown(String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.2)),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: _selectedBankCode,
              hint: const Text('Select Platform', style: TextStyle(fontSize: 14)),
              items: _banks.map((bank) => DropdownMenuItem<String>(
                value: bank['id'],
                child: Text(bank['name'], style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              )).toList(),
              onChanged: (val) => setState(() => _selectedBankCode = val),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller) {
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
          style: const TextStyle(fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            filled: true,
            fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppTheme.primary)),
          ),
        ),
      ],
    );
  }
}
