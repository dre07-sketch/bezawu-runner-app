
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import '../utils/theme.dart';
import '../widgets/order_card.dart';
import '../widgets/order_details_modal.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final ApiService _apiService = ApiService();
  List<Order> _orders = [];
  String _searchTerm = '';
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    try {
      final orders = await _apiService.fetchOrders();
      if (mounted) {
        setState(() {
          _orders = orders;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  List<Order> get _filteredOrders {
    return _orders.where((o) {
      final matchesSearch = o.customerName.toLowerCase().contains(_searchTerm.toLowerCase()) ||
          o.carProfile.plateNumber.toLowerCase().contains(_searchTerm.toLowerCase()) ||
          o.id.toLowerCase().contains(_searchTerm.toLowerCase());
      
      final isHistorical = o.status == OrderStatus.COMPLETED || o.status == OrderStatus.CANCELLED;
      
      return matchesSearch && isHistorical;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'ORDER HISTORY',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                    ),
                    Text(
                      'Review all your past deliveries and completed tasks',
                      style: TextStyle(color: Colors.grey.withOpacity(0.6), fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 32),
                    
                    // Search Bar
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextField(
                        onChanged: (val) => setState(() => _searchTerm = val),
                        decoration: InputDecoration(
                          hintText: 'SEARCH PAST ORDERS...',
                          hintStyle: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey.withOpacity(0.5), letterSpacing: 2),
                          icon: const Icon(LucideIcons.search, size: 18, color: AppTheme.primary),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 20),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Orders List
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 100),
              sliver: _isLoading
                ? const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppTheme.primary)))
                : _filteredOrders.isEmpty
                  ? SliverFillRemaining(child: _buildEmptyState())
                  : SliverGrid(
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: MediaQuery.of(context).size.width > 600 ? 2 : 1,
                        mainAxisSpacing: 20,
                        crossAxisSpacing: 20,
                        mainAxisExtent: 260,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final order = _filteredOrders[index];
                          return OrderCard(
                            order: order,
                            onTap: () => _showOrderDetails(order),
                          );
                        },
                        childCount: _filteredOrders.length,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _showOrderDetails(Order order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => OrderDetailsModal(
        order: order,
        onScanRequested: () {}, // No scanning in history
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: Colors.grey.withOpacity(0.05), shape: BoxShape.circle),
            child: const Icon(LucideIcons.clock, size: 48, color: Colors.grey),
          ),
          const SizedBox(height: 24),
          const Text('No past orders found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.grey)),
        ],
      ),
    );
  }
}
