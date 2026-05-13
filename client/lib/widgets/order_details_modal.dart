
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/order.dart';
import '../utils/theme.dart';

class OrderDetailsModal extends StatelessWidget {
  final Order order;
  final VoidCallback onScanRequested;

  const OrderDetailsModal({
    super.key,
    required this.order,
    required this.onScanRequested,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surfaceDark : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
      ),
      child: Column(
        children: [
          // Drag Handle
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(32),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        order.customerName,
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.grey.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '#${order.id.length > 8 ? order.id.substring(order.id.indexOf('-') + 1, order.id.indexOf('-') + 5) : order.id}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 8),
                          _buildStatusBadge(),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(LucideIcons.x),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.grey.withOpacity(0.1),
                    padding: const EdgeInsets.all(12),
                  ),
                ),
              ],
            ),
          ),
          
          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Gift Alert
                  if (order.isGift) ...[
                    _buildGiftSection(isDark),
                    const SizedBox(height: 24),
                  ],
                  
                  // Vehicle Section
                  _buildVehicleSection(isDark),
                  const SizedBox(height: 32),
                  
                  // Items Section
                  const Text(
                    'ITEMS',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 16),
                  ...order.items.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        if (item.imageUrl.isNotEmpty) ...[
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: CachedNetworkImage(
                              imageUrl: item.imageUrl,
                              width: 40,
                              height: 40,
                              fit: BoxFit.cover,
                              errorWidget: (context, url, error) => Container(
                                width: 40,
                                height: 40,
                                color: Colors.grey.withOpacity(0.1),
                                child: const Icon(LucideIcons.package, size: 20, color: Colors.grey),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                        ],
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Center(
                            child: Text(
                              '${item.quantity}x',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primary),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            item.name,
                            style: const TextStyle(fontWeight: FontWeight.w500),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  )),
                  
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
          
          // Action Button
          if (order.status != OrderStatus.COMPLETED && order.status != OrderStatus.CANCELLED)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        onScanRequested();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                        elevation: 0,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.qrCode),
                          SizedBox(width: 12),
                          Text('Scan QR for Handover', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Scan the customer\'s QR code to confirm handover and complete the order.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            )
          else if (order.status == OrderStatus.COMPLETED)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 32),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(color: AppTheme.primary.withOpacity(0.1)),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: AppTheme.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(LucideIcons.check, color: Colors.white, size: 24),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'ORDER COMPLETED',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Successfully handed over to customer',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.withOpacity(0.8),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        order.status.name.toUpperCase(),
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary),
      ),
    );
  }

  Widget _buildGiftSection(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.purple.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.purple.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.gift, color: Colors.purple, size: 18),
              SizedBox(width: 8),
              Text('SPECIAL GIFT ORDER', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.purple, fontSize: 12, letterSpacing: 1)),
            ],
          ),
          const SizedBox(height: 16),
          _buildInfoItem('RECIPIENT PHONE', order.recipientPhone ?? 'N/A', isLarge: true),
          if (order.giftMessage != null) ...[
            const SizedBox(height: 16),
            _buildInfoItem('MESSAGE', '"${order.giftMessage}"', isItalic: true),
          ],
        ],
      ),
    );
  }

  Widget _buildVehicleSection(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.02) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.eye, color: Colors.grey, size: 18),
              SizedBox(width: 8),
              Text('VEHICLE IDENTIFICATION', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.grey, fontSize: 12, letterSpacing: 1)),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              // Vehicle Image Placeholder
              Container(
                width: 120,
                height: 80,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: (order.carProfile.image != null && order.carProfile.image!.isNotEmpty)
                      ? CachedNetworkImage(
                          imageUrl: order.carProfile.image!,
                          fit: BoxFit.cover,
                          errorWidget: (context, url, error) => const Icon(LucideIcons.image, color: Colors.grey),
                        )
                      : const Icon(LucideIcons.image, color: Colors.grey),
                ),
              ),
              const SizedBox(width: 24),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildInfoItem('MODEL / TYPE', order.carProfile.model),
                    const SizedBox(height: 16),
                    _buildInfoItem('PLATE NUMBER', order.carProfile.plateNumber, isPlate: true),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildInfoItem('COLOR', order.carProfile.color),
        ],
      ),
    );
  }

  Widget _buildInfoItem(String label, String value, {bool isLarge = false, bool isItalic = false, bool isPlate = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 0.5)),
        const SizedBox(height: 4),
        if (isPlate)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFFACC15),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFEAB308), width: 2),
            ),
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.black),
            ),
          )
        else
          Text(
            value,
            style: TextStyle(
              fontWeight: isLarge ? FontWeight.w900 : FontWeight.bold,
              fontSize: isLarge ? 20 : 16,
              fontStyle: isItalic ? FontStyle.italic : FontStyle.normal,
            ),
          ),
      ],
    );
  }
}
