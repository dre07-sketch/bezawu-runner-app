
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api_service.dart';
import '../utils/theme.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _wallet;
  List<dynamic> _transactions = [];
  bool _isLoading = true;
  bool _isWithdrawing = false;
  String? _error;
  String? _success;

  double _toDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final wallet = await _apiService.getWallet();
      final transactions = await _apiService.getTransactions();
      setState(() {
        _wallet = wallet;
        _transactions = transactions;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load wallet data';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleWithdraw() async {
    final balance = _toDouble(_wallet?['current_balance']);
    if (_wallet == null || balance < 100) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Withdrawal', style: TextStyle(fontWeight: FontWeight.w900)),
        content: Text('Are you sure you want to withdraw ${_wallet!['current_balance']} ETB to your saved bank account?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('CANCEL')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('WITHDRAW', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold))),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() {
      _isWithdrawing = true;
      _error = null;
      _success = null;
    });

    try {
      await _apiService.withdraw();
      setState(() => _success = 'Withdrawal request submitted!');
      await _fetchData();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _isWithdrawing = false);
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
            const Text('Runner Wallet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
            Text('Track your earnings', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey.withOpacity(0.6), letterSpacing: 1)),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : ListView(
              padding: const EdgeInsets.all(24),
              children: [
                if (_error != null) _buildAlert(_error!, isError: true),
                if (_success != null) _buildAlert(_success!, isError: false),
                
                _buildBalanceCard(isDark),
                const SizedBox(height: 24),
                _buildWithdrawButton(isDark),
                const SizedBox(height: 32),
                const Text(
                  'RECENT ACTIVITY',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 2),
                ),
                const SizedBox(height: 16),
                if (_transactions.isEmpty)
                  _buildEmptyTransactions(isDark)
                else
                  ..._transactions.map((tx) => _buildTransactionItem(tx, isDark)),
              ],
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
      ),
      child: Row(
        children: [
          Icon(isError ? LucideIcons.alertCircle : LucideIcons.checkCircle, color: isError ? Colors.red : AppTheme.primary, size: 16),
          const SizedBox(width: 12),
          Text(msg, style: TextStyle(color: isError ? Colors.red : AppTheme.primary, fontSize: 13, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildBalanceCard(bool isDark) {
    final balance = _toDouble(_wallet?['current_balance']);
    final totalEarned = _toDouble(_wallet?['total_earned']);
    final totalWithdrawn = _toDouble(_wallet?['total_withdrawn']);

    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: const Color(0xFF10B981),
        borderRadius: BorderRadius.circular(40),
        boxShadow: [
          BoxShadow(color: const Color(0xFF10B981).withOpacity(0.3), blurRadius: 40, offset: const Offset(0, 10)),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('CURRENT BALANCE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.8), letterSpacing: 2)),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(balance.toStringAsFixed(2), style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w900, color: Colors.white)),
                  const SizedBox(width: 8),
                  Text('ETB', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white.withOpacity(0.7))),
                ],
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(child: _buildBalanceSubItem('TOTAL EARNED', totalEarned.toStringAsFixed(2))),
                  const SizedBox(width: 12),
                  Expanded(child: _buildBalanceSubItem('WITHDRAWN', totalWithdrawn.toStringAsFixed(2))),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceSubItem(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white.withOpacity(0.7), letterSpacing: 1)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildWithdrawButton(bool isDark) {
    final balance = _toDouble(_wallet?['current_balance']);
    final canWithdraw = balance >= 100;

    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: (canWithdraw && !_isWithdrawing) ? _handleWithdraw : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
              foregroundColor: isDark ? Colors.black : Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 20),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              elevation: 10,
              shadowColor: (isDark ? Colors.white : const Color(0xFF0F172A)).withOpacity(0.2),
            ),
            child: _isWithdrawing
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.creditCard, size: 20),
                      SizedBox(width: 12),
                      Text('REQUEST CASH OUT', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1)),
                    ],
                  ),
          ),
        ),
        if (!canWithdraw) ...[
          const SizedBox(height: 12),
          const Text(
            'Minimum withdrawal: 100 ETB',
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1),
          ),
        ],
      ],
    );
  }

  Widget _buildTransactionItem(dynamic tx, bool isDark) {
    final isWithdrawal = tx['type'] == 'WITHDRAWAL';
    final amount = double.parse(tx['amount'].toString());
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: (isWithdrawal ? Colors.orange : AppTheme.primary).withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              isWithdrawal ? LucideIcons.arrowUpRight : LucideIcons.shoppingBag,
              color: isWithdrawal ? Colors.orange : AppTheme.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tx['description'] ?? 'Transaction', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                Text(
                  DateTime.parse(tx['created_at']).toLocal().toString().split(' ')[0],
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isWithdrawal ? '-' : '+'}${amount.toStringAsFixed(2)}',
                style: TextStyle(
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  color: isWithdrawal ? Colors.orange : AppTheme.primary,
                ),
              ),
              Text(
                tx['status'].toString().toUpperCase(),
                style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.grey.withOpacity(0.5)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyTransactions(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.withOpacity(0.2), style: BorderStyle.solid),
      ),
      child: const Center(
        child: Text('No transactions yet', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
      ),
    );
  }
}
