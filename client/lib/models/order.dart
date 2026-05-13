
import '../utils/theme.dart';

enum OrderStatus {
  NEW,
  PREPARING,
  READY,
  ARRIVED,
  COMPLETED,
  CANCELLED,
  UNKNOWN
}

extension OrderStatusExtension on OrderStatus {
  String get name => toString().split('.').last;
  
  static OrderStatus fromString(String status) {
    return OrderStatus.values.firstWhere(
      (e) => e.name == status.toUpperCase(),
      orElse: () => OrderStatus.UNKNOWN,
    );
  }

  static double parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}


class Product {
  final String id;
  final String name;
  final double price;
  final String category;
  final String imageUrl;
  final bool inStock;

  Product({
    required this.id,
    required this.name,
    required this.price,
    required this.category,
    required this.imageUrl,
    required this.inStock,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      price: OrderStatusExtension.parseDouble(json['price'] ?? json['unit_price']),
      category: json['category'] ?? '',
      imageUrl: AppTheme.formatImageUrl(json['imageUrl'] ?? json['image_url'] ?? json['image'] ?? ''),
      inStock: json['inStock'] ?? json['in_stock'] ?? true,
    );
  }
}

class CartItem extends Product {
  final int quantity;

  CartItem({
    required super.id,
    required super.name,
    required super.price,
    required super.category,
    required super.imageUrl,
    required super.inStock,
    required this.quantity,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      price: OrderStatusExtension.parseDouble(json['price'] ?? json['unit_price']),
      category: json['category'] ?? '',
      imageUrl: AppTheme.formatImageUrl(json['imageUrl'] ?? json['image_url'] ?? json['image'] ?? ''),
      inStock: json['inStock'] ?? json['in_stock'] ?? true,
      quantity: json['quantity'] ?? 1,
    );
  }
}

class CarProfile {
  final String model;
  final String color;
  final String plateNumber;
  final String? image;

  CarProfile({
    required this.model,
    required this.color,
    required this.plateNumber,
    this.image,
  });

  factory CarProfile.fromJson(Map<String, dynamic> json) {
    return CarProfile(
      model: json['model'] ?? json['car_model'] ?? '',
      color: json['color'] ?? json['car_color'] ?? '',
      plateNumber: json['plateNumber'] ?? json['plate_number'] ?? json['car_plate'] ?? '',
      image: AppTheme.formatImageUrl(json['image'] ?? json['car_image']),
    );
  }
}

class Order {
  final String id;
  final String customerName;
  final List<CartItem> items;
  final double totalPrice;
  final OrderStatus status;
  final CarProfile carProfile;
  final DateTime createdAt;
  final String pickupCode;
  final String? scheduledPickupTime;
  final String? orderNote;
  final bool isGift;
  final String? recipientPhone;
  final String? giftMessage;

  Order({
    required this.id,
    required this.customerName,
    required this.items,
    required this.totalPrice,
    required this.status,
    required this.carProfile,
    required this.createdAt,
    required this.pickupCode,
    this.scheduledPickupTime,
    this.orderNote,
    required this.isGift,
    this.recipientPhone,
    this.giftMessage,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] ?? '',
      customerName: json['customerName'] ?? json['customer_name'] ?? json['customer']?['name'] ?? '',
      items: (json['items'] as List? ?? [])
          .map((i) => CartItem.fromJson(i))
          .toList(),
      totalPrice: OrderStatusExtension.parseDouble(json['totalPrice'] ?? json['total_price']),
      status: OrderStatusExtension.fromString(json['status']?.toString() ?? ''),
      carProfile: CarProfile.fromJson(json['carProfile'] ?? json['car_profile'] ?? json),
      createdAt: (json['createdAt'] ?? json['created_at']) != null 
          ? DateTime.parse(json['createdAt'] ?? json['created_at']) 
          : DateTime.now(),
      pickupCode: json['pickupCode'] ?? json['pickup_code'] ?? '',
      scheduledPickupTime: json['scheduledPickupTime'] ?? json['scheduled_pickup_time'],
      orderNote: json['orderNote'] ?? json['order_note'],
      isGift: json['isGift'] ?? json['is_gift'] ?? false,
      recipientPhone: json['recipientPhone'] ?? json['recipient_phone'] ?? json['customer']?['phone'],
      giftMessage: json['giftMessage'] ?? json['gift_message'],
    );
  }
}
