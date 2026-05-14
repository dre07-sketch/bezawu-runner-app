
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/order.dart';
import '../utils/theme.dart';

class FulfillmentScreen extends StatefulWidget {
  final Order order;
  final VoidCallback onConfirmed;

  const FulfillmentScreen({
    super.key,
    required this.order,
    required this.onConfirmed,
  });

  @override
  State<FulfillmentScreen> createState() => _FulfillmentScreenState();
}

class _FulfillmentScreenState extends State<FulfillmentScreen> {
  final Set<String> _pickedItems = {};
  bool _isConfirmed = false;
  bool _isSubmitting = false;

  void _toggleItem(String id) {
    setState(() {
      if (_pickedItems.contains(id)) {
        _pickedItems.remove(id);
      } else {
        _pickedItems.add(id);
      }
    });
  }

  Future<void> _handleConfirm() async {
    setState(() => _isSubmitting = true);
    try {
      widget.onConfirmed();
      setState(() => _isConfirmed = true);
    } catch (e) {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isConfirmed) {
      return Scaffold(
        body: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isDark 
                ? [const Color(0xFF0F172A), const Color(0xFF020617)]
                : [const Color(0xFFF8FAFC), Colors.white],
            ),
          ),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0.0, end: 1.0),
                    duration: const Duration(milliseconds: 800),
                    curve: Curves.elasticOut,
                    builder: (context, value, child) {
                      return Transform.scale(
                        scale: value,
                        child: Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary.withOpacity(0.5 * value),
                                blurRadius: 40 * value,
                                spreadRadius: 10 * value,
                              ),
                            ],
                          ),
                          child: const Icon(LucideIcons.checkCircle2, color: Colors.white, size: 60),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 48),
                  const Text(
                    'HANDOVER COMPLETE',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: -1),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      'The customer has been notified and their digital receipt has been dispatched.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 15, 
                        fontWeight: FontWeight.w600, 
                        color: Colors.grey.withOpacity(0.7),
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 64),
                  SizedBox(
                    width: 220,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        elevation: 10,
                        shadowColor: AppTheme.primary.withOpacity(0.4),
                      ),
                      child: const Text(
                        'RETURN TO HUB',
                        style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 2),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          // Background blurry circles
          Positioned(
            top: -50,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.05),
                shape: BoxShape.circle,
              ),
            ),
          ),
          
          Column(
            children: [
              // Header
              _buildHeader(isDark),
              
              // Content
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    // Status Badge
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle)),
                            const SizedBox(width: 12),
                            Text(
                              widget.order.status.name.toUpperCase(),
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppTheme.primary, letterSpacing: 1, fontStyle: FontStyle.italic),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Client Identity
                    _buildIdentitySection(isDark),
                    const SizedBox(height: 24),
                    
                    // Vehicle Section
                    _buildVehicleSection(isDark),
                    const SizedBox(height: 24),
                    
                    // Manifest
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(LucideIcons.package, color: AppTheme.primary, size: 16),
                            SizedBox(width: 12),
                            Text('MANIFEST', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: _pickedItems.length == widget.order.items.length ? AppTheme.primary : (isDark ? Colors.white10 : const Color(0xFF1E293B)),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '${_pickedItems.length}/${widget.order.items.length} CHECKED',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 1),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ...widget.order.items.map((item) => _buildManifestItem(item, isDark)),
                    
                    const SizedBox(height: 24),
                    
                    // Total Section
                    _buildTotalSection(isDark),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
              
              // Footer Button
              _buildFooter(isDark),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Container(
      padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 8, 16, 16),
      decoration: BoxDecoration(
        color: Colors.transparent,
        border: Border(bottom: BorderSide(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(LucideIcons.chevronLeft),
          ),
          Column(
            children: [
              const Text(
                'MAIN BRANCH',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.primary, letterSpacing: 2),
              ),
              Text(
                'FULFILLMENT CENTER',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey.withOpacity(0.6), letterSpacing: 2),
              ),
            ],
          ),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
            ),
            child: const Icon(LucideIcons.qrCode, color: AppTheme.primary, size: 18),
          ),
        ],
      ),
    );
  }

  Widget _buildIdentitySection(bool isDark) {
    if (widget.order.isGift) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF121418).withOpacity(0.8) : Colors.white,
          borderRadius: BorderRadius.circular(40),
          border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.pink.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: const Icon(LucideIcons.package, color: Colors.pink, size: 20),
                ),
                const SizedBox(width: 12),
                const Text('SPECIAL GIFT ORDER', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.pink, letterSpacing: 1)),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('GIFT FROM', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                      Text(widget.order.customerName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('GIFT TO', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                      Text(widget.order.recipientPhone ?? 'Recipient', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.primary)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121418).withOpacity(0.8) : Colors.white,
        borderRadius: BorderRadius.circular(40),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppTheme.primary,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: AppTheme.primary.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))],
            ),
            child: const Icon(LucideIcons.user, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.order.customerName, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                Text(
                  'PLATINUM #${widget.order.id.substring(0, 6)}',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
            ),
            child: const Icon(LucideIcons.phone, color: AppTheme.primary, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildVehicleSection(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121418).withOpacity(0.8) : Colors.white,
        borderRadius: BorderRadius.circular(40),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          const Row(
            children: [
              Icon(LucideIcons.car, color: AppTheme.primary, size: 16),
              SizedBox(width: 12),
              Text('VEHICLE ID', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF0A0C10),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('PLATE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                    Text(widget.order.carProfile.plateNumber, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1)),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('MODEL', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                    Text(
                      '${widget.order.carProfile.color}\n${widget.order.carProfile.model}',
                      textAlign: TextAlign.right,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.primary, height: 1.1),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildManifestItem(CartItem item, bool isDark) {
    final isPicked = _pickedItems.contains(item.id);
    
    return GestureDetector(
      onTap: () => _toggleItem(item.id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isPicked ? AppTheme.primary.withOpacity(0.1) : (isDark ? const Color(0xFF121418).withOpacity(0.6) : Colors.white),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: isPicked ? AppTheme.primary.withOpacity(0.4) : (isDark ? Colors.white10 : const Color(0xFFE2E8F0))),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isPicked ? AppTheme.primary : (isDark ? const Color(0xFF0A0C10) : const Color(0xFFF8FAFC)),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isPicked ? AppTheme.primary : (isDark ? Colors.white10 : const Color(0xFFE2E8F0))),
              ),
              child: Center(
                child: isPicked 
                  ? const Icon(LucideIcons.checkCircle, color: Colors.white, size: 20)
                  : Text(item.quantity.toString(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      decoration: isPicked ? TextDecoration.lineThrough : null,
                      color: isPicked ? Colors.grey : (isDark ? Colors.white : Colors.black),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${item.price.toStringAsFixed(0)} ETB / unit', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1)),
                      Text('${(item.price * item.quantity).toStringAsFixed(0)} ETB', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.primary, letterSpacing: 1)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTotalSection(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(40),
        border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('SUBTOTAL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
              Text('${widget.order.totalPrice.toStringAsFixed(0)} ETB', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900)),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(color: Colors.white10),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('TOTAL PAID', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(widget.order.totalPrice.toStringAsFixed(0), style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: AppTheme.primary, letterSpacing: -2)),
                      const SizedBox(width: 4),
                      const Text('ETB', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppTheme.primary, fontStyle: FontStyle.italic)),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F1115),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white10),
                ),
                child: const Row(
                  children: [
                    Icon(LucideIcons.checkCircle, color: AppTheme.primary, size: 12),
                    SizedBox(width: 8),
                    Text('VERIFIED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121418).withOpacity(0.9) : Colors.white,
        border: Border(top: BorderSide(color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05))),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _handleConfirm,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 20),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              elevation: 0,
            ),
            child: _isSubmitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('CONFIRM HANDOVER', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 4)),
                      SizedBox(width: 12),
                      Icon(LucideIcons.arrowRight, size: 18),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
