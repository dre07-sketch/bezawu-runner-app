
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../models/order.dart';
import '../utils/theme.dart';

class OrderCard extends StatelessWidget {
  final Order order;
  final VoidCallback onTap;

  const OrderCard({super.key, required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isArrived = order.status == OrderStatus.ARRIVED;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(40),
      child: Container(
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.surfaceDark.withOpacity(0.5) : Colors.white,
          borderRadius: BorderRadius.circular(40),
          border: Border.all(
            color: isArrived 
              ? Colors.red.withOpacity(0.5) 
              : (isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF1F5F9)),
            width: isArrived ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isArrived ? Colors.red.withOpacity(0.05) : Colors.black.withOpacity(0.02),
              blurRadius: 30,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status & Order ID
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStatusBadge(),
                Text(
                  '#${order.id.length > 6 ? order.id.substring(0, 6) : order.id}'.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10, 
                    fontWeight: FontWeight.w900, 
                    color: Colors.grey.withOpacity(0.6), 
                    letterSpacing: 2
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 20),
            
            // Customer Name
            Text(
              order.customerName,
              style: const TextStyle(
                fontWeight: FontWeight.w900, 
                fontSize: 22, 
                letterSpacing: -0.5,
                height: 1.1
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
            
            const SizedBox(height: 12),
            
            // Items manifest
            Text(
              order.items.map((i) => '${i.quantity}x ${i.name}').join(', '),
              style: TextStyle(
                fontSize: 13, 
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.grey[400] : const Color(0xFF64748B),
                height: 1.4
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            
            const SizedBox(height: 24),
            
            // Bottom Info Bar
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.03) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(LucideIcons.car, size: 16, color: AppTheme.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.carProfile.model.toUpperCase(),
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1),
                        ),
                        Text(
                          order.carProfile.plateNumber,
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '${order.totalPrice.toInt()} ETB',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.primary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge() {
    Color color;
    switch (order.status) {
      case OrderStatus.NEW: color = Colors.blue; break;
      case OrderStatus.PREPARING: color = Colors.orange; break;
      case OrderStatus.READY: color = AppTheme.primary; break;
      case OrderStatus.ARRIVED: color = Colors.red; break;
      default: color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            order.status.name.toUpperCase(),
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w900,
              color: color,
              letterSpacing: 1,
            ),
          ),
        ],
      ),
    );
  }
}
