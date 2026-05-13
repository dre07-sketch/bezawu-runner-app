
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/order.dart';

class ApiService {
  static const String baseUrl = 'https://runnerapi.bezawcurbside.com/api';
  
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('bezaw_token');
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('bezaw_token', token);
  }

  Future<void> _saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('bezaw_user', jsonEncode(user));
  }

  Future<Map<String, dynamic>?> getStoredUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('bezaw_user');
    if (userStr != null) {
      return jsonDecode(userStr);
    }
    return null;
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('bezaw_token');
    await prefs.remove('bezaw_user');
  }

  Future<Map<String, dynamic>> login(String id, {String? password}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/runner/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'id': id,
        if (password != null) 'password': password,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      if (data['token'] != null) {
        await _saveToken(data['token']);
        await _saveUser(data['user']);
      }
      return data;
    } else {
      throw Exception(data['message'] ?? 'Login failed');
    }
  }

  Future<Map<String, dynamic>> setupPassword(String id, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/runner/setup-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'id': id, 'password': password}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      if (data['token'] != null) {
        await _saveToken(data['token']);
        await _saveUser(data['user']);
      }
      return data;
    } else {
      throw Exception(data['message'] ?? 'Failed to setup password');
    }
  }

  Future<List<Order>> fetchOrders() async {
    final token = await _getToken();
    if (token == null) throw Exception('Unauthorized');

    final response = await http.get(
      Uri.parse('$baseUrl/orders/employee-view'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final decoded = jsonDecode(response.body);
      List data;
      if (decoded is List) {
        data = decoded;
      } else if (decoded is Map && decoded['data'] is List) {
        data = decoded['data'];
      } else {
        throw Exception('Unexpected response format');
      }
      return data.map((o) => Order.fromJson(o)).toList();
    } else if (response.statusCode == 401 || response.statusCode == 403) {
      await clearSession();
      throw Exception('Session expired');
    } else {
      throw Exception('Failed to fetch orders');
    }
  }

  Future<Order> fetchOrderById(String id) async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/orders/employee-view/$id'),
      headers: token != null ? {'Authorization': 'Bearer $token'} : {},
    );

    if (response.statusCode == 200) {
      return Order.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Order not found');
    }
  }

  Future<void> updateOrderStatus(String orderId, OrderStatus status) async {
    final token = await _getToken();
    if (token == null) throw Exception('Unauthorized');

    final response = await http.put(
      Uri.parse('$baseUrl/orders/employee-view/$orderId/status'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'status': status.name}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update status');
    }
  }

  Future<Map<String, dynamic>> getProfile() async {
    final token = await _getToken();
    if (token == null) throw Exception('Unauthorized');

    final response = await http.get(
      Uri.parse('$baseUrl/profile'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch profile');
    }
  }

  Future<void> updateFinancialSettings(Map<String, dynamic> data) async {
    final token = await _getToken();
    if (token == null) throw Exception('Unauthorized');

    final response = await http.post(
      Uri.parse('$baseUrl/profile/financial'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(data),
    );

    if (response.statusCode != 200) {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to save financial settings');
    }
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    final token = await _getToken();
    if (token == null) throw Exception('Unauthorized');

    final response = await http.put(
      Uri.parse('$baseUrl/profile'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      // Update local storage
      final currentProfile = await getProfile();
      if (currentProfile['data'] != null) {
        await _saveUser(currentProfile['data']);
      }
    } else {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to update profile');
    }
  }

  Future<String> uploadProfileImage(String filePath) async {
    final token = await _getToken();
    if (token == null) throw Exception('Unauthorized');

    final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/profile/upload'));
    request.headers['Authorization'] = 'Bearer $token';
    request.files.add(await http.MultipartFile.fromPath('image', filePath));

    final response = await request.send();
    final responseBody = await response.stream.bytesToString();
    final data = jsonDecode(responseBody);

    if (response.statusCode == 200) {
      // Update local storage after upload
      final currentProfile = await getProfile();
      if (currentProfile['data'] != null) {
        await _saveUser(currentProfile['data']);
      }
      return data['imageUrl'];
    } else {
      throw Exception(data['message'] ?? 'Failed to upload image');
    }
  }

  Future<void> changePassword(String newPassword) async {
    final token = await _getToken();
    if (token == null) throw Exception('Unauthorized');

    final response = await http.post(
      Uri.parse('$baseUrl/profile/change-password'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'new_password': newPassword,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to change password');
    }
  }

  Future<Map<String, dynamic>> forgotPassword(String id) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/runner/forgot-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'id': id}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Failed to request OTP');
    }
  }

  Future<void> resetPassword({
    required String id,
    required String otp,
    required String newPassword,
    required String token,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/runner/reset-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'id': id,
        'otp': otp,
        'new_password': newPassword,
        'token': token,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Failed to reset password');
    }
  }

  Future<Map<String, dynamic>> getWallet() async {
    final token = await _getToken();
    if (token == null) throw Exception('Unauthorized');

    final response = await http.get(
      Uri.parse('$baseUrl/wallet'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body)['data'];
    } else {
      throw Exception('Failed to fetch wallet');
    }
  }

  Future<List<dynamic>> getTransactions() async {
    final token = await _getToken();
    if (token == null) throw Exception('Unauthorized');

    final response = await http.get(
      Uri.parse('$baseUrl/wallet/transactions'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body)['data'];
    } else {
      throw Exception('Failed to fetch transactions');
    }
  }

  Future<void> withdraw() async {
    final token = await _getToken();
    if (token == null) throw Exception('Unauthorized');

    final response = await http.post(
      Uri.parse('$baseUrl/wallet/withdraw'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode != 200) {
      throw Exception(jsonDecode(response.body)['message'] ?? 'Withdrawal failed');
    }
  }
}