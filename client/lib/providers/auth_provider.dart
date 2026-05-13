
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _user;
  bool _isLoading = true;

  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  ApiService get apiService => _apiService;

  AuthProvider() {
    _loadUser();
  }

  Future<void> _loadUser() async {
    _user = await _apiService.getStoredUser();
    _isLoading = false;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    final updatedUser = await _apiService.getStoredUser();
    if (updatedUser != null) {
      _user = updatedUser;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> login(String id, {String? password}) async {
    final result = await _apiService.login(id, password: password);
    if (result['token'] != null) {
      _user = result['user'];
      notifyListeners();
    }
    return result;
  }

  Future<Map<String, dynamic>> setupPassword(String id, String password) async {
    final result = await _apiService.setupPassword(id, password);
    if (result['token'] != null) {
      _user = result['user'];
      notifyListeners();
    }
    return result;
  }

  Future<void> logout() async {
    await _apiService.clearSession();
    _user = null;
    notifyListeners();
  }
}
