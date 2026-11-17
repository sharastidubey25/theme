import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.network = false});
  final String message;
  final int? statusCode;

  /// True when the server was never reached (offline, timeout, DNS…).
  final bool network;
  @override
  String toString() => message;
}

/// Port of `app/lib/httpRequest.js`. Every request carries an
/// `Authorization` header — empty for guests — because the API rejects
/// requests where it is missing.
class ApiClient {
  ApiClient()
      : _dio = Dio(BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 30),
          headers: {'Accept': 'application/json'},
        )) {
    _dio.interceptors.add(InterceptorsWrapper(onRequest: (o, h) {
      final t = token;
      o.headers['Authorization'] = t != null && t.isNotEmpty ? 'Bearer $t' : '';
      h.next(o);
    }));
  }

  final Dio _dio;

  /// Set after login (auth screens are migrated later).
  String? token;

  Future<dynamic> get(String endPoint, String url, {Map<String, Object?> query = const {}}) =>
      _send(() => _dio.get('$endPoint/$url', queryParameters: _stringify(query)));

  Future<dynamic> post(String endPoint, String url, {Object? body}) =>
      _send(() => _dio.post('$endPoint/$url', data: body));

  /// multipart/form-data upload (RN HTTPRequest.Post with isRaw = true).
  Future<dynamic> postMultipart(String endPoint, String url, FormData form) =>
      _send(() => _dio.post('$endPoint/$url', data: form));

  Future<dynamic> _send(Future<Response> Function() call) async {
    try {
      final res = await call();
      final data = res.data;
      // RN screens treat any body statusCode other than 200 as a failure.
      final code = data is Map ? data['statusCode'] : null;
      if (data is Map && (data['success'] == false || data['success'] == 'false' || (code is int && code != 200))) {
        throw ApiException('${data['message'] ?? 'Something went wrong'}', statusCode: data['statusCode'] as int?);
      }
      return data is Map ? data['data'] : data;
    } on DioException catch (e) {
      final body = e.response?.data;
      if (body is Map && body['message'] != null) {
        throw ApiException('${body['message']}', statusCode: e.response?.statusCode);
      }
      throw ApiException('Unable to reach server. Check your connection.', statusCode: e.response?.statusCode, network: true);
    }
  }

  // The RN client sends every filter key, even empty ones; the API expects that.
  static Map<String, String> _stringify(Map<String, Object?> q) => q.map((k, v) => MapEntry(k, v?.toString() ?? ''));
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
