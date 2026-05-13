
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import '../utils/theme.dart';
import '../widgets/order_card.dart';
import '../widgets/order_details_modal.dart';
import '../widgets/bezaw_image.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'qr_scanner_screen.dart';
import 'fulfillment_screen.dart';
import 'financial_settings_screen.dart';
import 'wallet_screen.dart';
import 'settings_screen.dart';

class DashboardScreen extends StatefulWidget {
  final DashboardTab initialTab;
  const DashboardScreen({super.key, this.initialTab = DashboardTab.ready});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

enum DashboardTab { preparing, ready, gifts }

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  List<Order> _orders = [];
  late DashboardTab _activeTab;
  String _searchTerm = '';
  Timer? _refreshTimer;
  bool _isInitialLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _activeTab = widget.initialTab;
    _fetchOrders();
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) => _fetchOrders());
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchOrders() async {
    try {
      final orders = await _apiService.fetchOrders();
      if (mounted) {
        setState(() {
          _orders = orders;
          _isInitialLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _isInitialLoading = false;
        });
      }
    }
  }

  List<Order> get _filteredOrders {
    return _orders.where((o) {
      final matchesSearch = o.customerName.toLowerCase().contains(_searchTerm.toLowerCase()) ||
          o.carProfile.plateNumber.toLowerCase().contains(_searchTerm.toLowerCase()) ||
          o.id.toLowerCase().contains(_searchTerm.toLowerCase());
      
      if (!matchesSearch || o.status == OrderStatus.UNKNOWN) return false;

      switch (_activeTab) {
        case DashboardTab.preparing:
          return o.status == OrderStatus.NEW || o.status == OrderStatus.PREPARING;
        case DashboardTab.ready:
          return o.status == OrderStatus.READY || o.status == OrderStatus.ARRIVED;
        case DashboardTab.gifts:
          return o.isGift;
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user ?? {};
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // Premium Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white10 : const Color(0xFFF1F5F9),
                                shape: BoxShape.circle,
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(100),
                                child: Builder(
                                  builder: (context) {
                                    final imgPath = (user['pro_image'] ?? user['profile_image'] ?? user['image'] ?? user['image_url']);
                                    return BezawImage(
                                      imagePath: imgPath,
                                      fit: BoxFit.cover,
                                      placeholder: const Center(
                                        child: SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(strokeWidth: 2),
                                        ),
                                      ),
                                      errorWidget: const Icon(LucideIcons.user, color: Colors.grey),
                                    );
                                  },
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  (user['name'] ?? 'Kaleb Tilahun').toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 18, 
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.5
                                  ),
                                ),
                                Row(
                                  children: [
                                    Container(
                                      width: 4,
                                      height: 4,
                                      decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      (user['branch_name'] ?? 'Main Branch').toUpperCase(),
                                      style: TextStyle(
                                        fontSize: 9, 
                                        fontWeight: FontWeight.w900, 
                                        color: Colors.grey.withOpacity(0.8),
                                        letterSpacing: 1
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    
                    // Modern Search
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          if (!isDark) BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 20,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: TextField(
                        onChanged: (val) => setState(() => _searchTerm = val),
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'SEARCH PLATES / NAMES',
                          hintStyle: TextStyle(
                            fontSize: 10, 
                            fontWeight: FontWeight.w900, 
                            color: Colors.grey.withOpacity(0.5),
                            letterSpacing: 2
                          ),
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

            // Navigation Tabs
            SliverPersistentHeader(
              pinned: true,
              delegate: _TabHeaderDelegate(
                child: Container(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildTab('PREPARING', DashboardTab.preparing, count: _orders.where((o) => o.status != OrderStatus.UNKNOWN && (o.status == OrderStatus.NEW || o.status == OrderStatus.PREPARING)).length),
                      _buildTab('READY', DashboardTab.ready, count: _orders.where((o) => o.status != OrderStatus.UNKNOWN && (o.status == OrderStatus.READY || o.status == OrderStatus.ARRIVED)).length),
                      _buildTab('GIFTS', DashboardTab.gifts, count: _orders.where((o) => o.status != OrderStatus.UNKNOWN && o.isGift).length),
                    ],
                  ),
                ),
              ),
            ),

            // Orders Grid
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 100),
              sliver: _isInitialLoading
                ? const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
                  )
                : _error != null && _orders.isEmpty
                  ? SliverFillRemaining(child: _buildErrorState())
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

  Widget _buildTab(String label, DashboardTab tab, {int? count}) {
    final isActive = _activeTab == tab;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return GestureDetector(
      onTap: () => setState(() => _activeTab = tab),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 6),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(
          color: isActive 
            ? AppTheme.primary 
            : (isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
                color: isActive ? Colors.white : (isDark ? Colors.white60 : Colors.black54),
              ),
            ),
            if (count != null && count > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isActive ? Colors.white.withOpacity(0.2) : AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  count.toString(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: isActive ? Colors.white : AppTheme.primary,
                  ),
                ),
              ),
            ],
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
        onScanRequested: () => _startQRScan(order),
      ),
    );
  }

  void _startQRScan(Order order) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const QRScannerScreen()),
    );

    if (result != null) {
      _handleQRResult(result, order);
    }
  }

  void _handleQRResult(String code, Order targetOrder) {
    if (code == targetOrder.id || code == targetOrder.pickupCode || code.contains(targetOrder.id)) {
      _openFulfillment(targetOrder);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid QR code for this order')),
      );
    }
  }

  void _openFulfillment(Order order) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => FulfillmentScreen(
          order: order,
          onConfirmed: () {
            _apiService.updateOrderStatus(order.id, OrderStatus.COMPLETED);
            _fetchOrders();
          },
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(LucideIcons.package, size: 48, color: Colors.grey),
          ),
          const SizedBox(height: 24),
          Text(
            'No ${_activeTab.name} orders',
            style: TextStyle(
              fontSize: 22, 
              fontWeight: FontWeight.w900, 
              color: isDark ? Colors.white70 : const Color(0xFF64748B),
              letterSpacing: -0.5
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Everything is cleared or quiet!',
            style: TextStyle(
              color: Colors.grey.withOpacity(0.6),
              fontSize: 15,
              fontWeight: FontWeight.w500
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.alertTriangle, size: 48, color: Colors.amber),
            const SizedBox(height: 16),
            const Text(
              'Failed to load orders',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Unknown error occurred',
              textAlign: TextAlign.center,
              style: TextStyle(color: isDark ? Colors.white54 : Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _isInitialLoading = true;
                  _error = null;
                });
                _fetchOrders();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
              ),
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabHeaderDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;

  _TabHeaderDelegate({required this.child});

  @override
  double get minExtent => 74.0; // Slightly smaller to avoid constraints errors
  @override
  double get maxExtent => 74.0;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return SizedBox.expand(child: child);
  }

  @override
  bool shouldRebuild(_TabHeaderDelegate oldDelegate) {
    return oldDelegate.child != child;
  }
}
