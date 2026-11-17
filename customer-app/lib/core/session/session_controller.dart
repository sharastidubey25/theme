import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../network/api_client.dart';

/// Logged-in customer as returned by `auth/otp-verification`.
/// The raw map is kept so later screens can read fields we don't model yet.
class UserSession {
  const UserSession(this.raw);
  final Map<String, dynamic> raw;

  String get token => '${raw['token'] ?? ''}';
  String get name => '${raw['full_name'] ?? raw['fullName'] ?? raw['name'] ?? ''}';
  String get mobile => '${raw['mobile'] ?? ''}';

  Map<String, dynamic> toJson() => raw;
}

/// Replaces Redux `user` + `global.user` + AsyncStorage("appData").user.
class SessionController extends StateNotifier<UserSession?> {
  SessionController(this._api, this._prefs) : super(null) {
    final saved = _prefs.getString(_key);
    if (saved != null) {
      try {
        _set(UserSession(jsonDecode(saved) as Map<String, dynamic>));
      } catch (_) {
        _prefs.remove(_key);
      }
    }
  }

  static const _key = 'session.user';
  final ApiClient _api;
  final SharedPreferences _prefs;

  bool get isLoggedIn => state != null && state!.token.isNotEmpty;

  Future<void> signIn(Map<String, dynamic> user) async {
    _set(UserSession(user));
    await _prefs.setString(_key, jsonEncode(user));
  }

  Future<void> signOut() async {
    _set(null);
    await _prefs.remove(_key);
  }

  void _set(UserSession? s) {
    _api.token = s?.token;
    state = s;
  }
}

/// Overridden in main() with the loaded instance.
final sharedPrefsProvider = Provider<SharedPreferences>((_) => throw UnimplementedError('sharedPrefsProvider not overridden'));

final sessionProvider = StateNotifierProvider<SessionController, UserSession?>(
  (ref) => SessionController(ref.watch(apiClientProvider), ref.watch(sharedPrefsProvider)),
);

final isLoggedInProvider = Provider<bool>((ref) => (ref.watch(sessionProvider)?.token ?? '').isNotEmpty);
