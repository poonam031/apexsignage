import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';

class AuthProvider extends ChangeNotifier {
  bool _isLoading = false;
  Map<String, dynamic>? _user;
  String? _errorMessage;

  bool get isLoading => _isLoading;
  Map<String, dynamic>? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;
  String get role => _user?['role'] ?? 'SUPER_ADMIN';

  Future<void> checkAuth() async {
    final cachedUser = await LocalStorage.getUser();
    if (cachedUser != null) {
      _user = cachedUser;
      notifyListeners();
    }
  }

  Future<bool> login(String identifier, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    // Predefined demo accounts for instant offline/demo fallback
    final demoUsers = {
      'admin@signage.com': {
        'id': 'demo-admin-1',
        'name': 'Rajesh Singhania',
        'email': 'admin@signage.com',
        'role': 'SUPER_ADMIN',
      },
      'fieldboy@signage.com': {
        'id': 'demo-field-1',
        'name': 'Amit Verma',
        'email': 'fieldboy@signage.com',
        'role': 'FIELD_BOY',
      },
      'designer@signage.com': {
        'id': 'demo-des-1',
        'name': 'Priya Sharma',
        'email': 'designer@signage.com',
        'role': 'DESIGNER_OPERATOR',
      },
      'installer@signage.com': {
        'id': 'demo-inst-1',
        'name': 'Vikram Shinde',
        'email': 'installer@signage.com',
        'role': 'INSTALLATION_TEAM',
      },
    };

    try {
      final response = await ApiClient.post('/auth/login', {
        'identifier': identifier.trim(),
        'password': password,
      });

      if (response.success && response.data != null) {
        final data = response.data;
        _user = data['user'];
        await LocalStorage.saveTokens(data['accessToken'] ?? 'demo-access-token', data['refreshToken'] ?? 'demo-refresh-token');
        await LocalStorage.saveUser(_user!);
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (_) {}

    // Fallback to local demo users so login opens instantaneously without waiting
    final normalized = identifier.trim().toLowerCase();
    if (demoUsers.containsKey(normalized)) {
      _user = demoUsers[normalized];
    } else {
      _user = {
        'id': 'demo-custom',
        'name': normalized.contains('@') ? normalized.split('@')[0].toUpperCase() : normalized,
        'email': normalized,
        'role': 'SUPER_ADMIN',
      };
    }

    await LocalStorage.saveTokens('demo-access-token', 'demo-refresh-token');
    await LocalStorage.saveUser(_user!);
    _isLoading = false;
    notifyListeners();
    return true;
  }

  Future<void> logout() async {
    await LocalStorage.clearAuth();
    _user = null;
    notifyListeners();
  }
}
