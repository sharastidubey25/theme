import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/device/device_meta.dart';
import '../../../core/network/api_client.dart';

enum AccountType {
  individual('individual', 'Individual'),
  firm('firm', 'Firm / Business'),
  government('government', 'Government Organisation');

  const AccountType(this.id, this.label);
  final String id;
  final String label;
}

/// Port of app/services/auth.js.
class AuthRepository {
  AuthRepository(this._api);
  final ApiClient _api;

  /// Login screen → auth/send-verification-otp
  Future<void> sendOtp(String mobile) => _api.post('auth', 'send-verification-otp', body: {'mobile': mobile});

  /// Register screen → auth/login (creates the account and sends the OTP)
  Future<void> register({
    required String mobile,
    required String fullName,
    required String email,
    required AccountType type,
    String firmName = '',
    String partnerCode = '',
  }) async {
    final d = await DeviceMeta.load();
    await _api.post('auth', 'login', body: {
      'mobile': mobile,
      'fullName': fullName,
      'email': email,
      'firmName': firmName,
      'partnerCode': partnerCode,
      'customerAccountType': type.id,
      'deviceIP': d.deviceIP,
      'deviceID': d.deviceID,
      'deviceToken': '', // TODO(push): FCM token once Firebase is added
      'deviceType': d.deviceType,
      'appVersion': d.appVersion,
    });
  }

  /// OTP screen → auth/otp-verification. Returns the user (with token).
  Future<Map<String, dynamic>> verifyOtp(String mobile, String otp) async {
    final d = await DeviceMeta.load();
    final data = await _api.post('auth', 'otp-verification', body: {
      'mobile': mobile,
      'otp': otp,
      'deviceIP': d.deviceIP,
      'deviceID': d.deviceID,
      'deviceType': d.deviceType,
      'appVersion': d.appVersion,
    });
    if (data is! Map<String, dynamic>) throw ApiException('Unexpected response from server');
    return data;
  }

  Future<void> logout() async {
    final d = await DeviceMeta.load();
    await _api.post('auth', 'logout', body: {
      'deviceID': d.deviceID,
      'deviceIP': d.deviceIP,
      'deviceType': d.deviceType,
      'appVersion': d.appVersion,
    });
  }
}

final authRepositoryProvider = Provider((ref) => AuthRepository(ref.watch(apiClientProvider)));

/// Same rules as app/lib/validation.js.
abstract final class Validators {
  static String? mobile(String v, {String empty = 'Mobile number cannot be empty'}) {
    final t = v.trim();
    if (t.isEmpty) return empty;
    if (t.length != 10 || !RegExp(r'^\d+$').hasMatch(t)) return 'Please enter a valid mobile number';
    return null;
  }

  static String? required(String v, String message) => v.trim().isEmpty ? message : null;

  static String? email(String v, {String empty = 'Email cannot be empty'}) {
    final t = v.trim();
    if (t.isEmpty) return empty;
    final ok = RegExp(r'^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$')
        .hasMatch(t);
    return ok ? null : 'Please enter a valid email';
  }
}
