import 'package:customerapp/core/network/api_client.dart';
import 'package:customerapp/core/session/session_controller.dart';
import 'package:customerapp/features/auth/data/auth_repository.dart';
import 'package:customerapp/features/home/data/home_repository.dart';
import 'package:customerapp/main.dart';
import 'package:customerapp/router/app_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Offline home data: network sections render empty.
class FakeHomeRepo extends HomeRepository {
  FakeHomeRepo() : super(ApiClient());
  @override
  Future<List<Never>> banners(String bannerType) async => [];
  @override
  Future<List<Never>> highlightedServices() async => [];
  @override
  Future<List<Never>> videoTestimonials() async => [];
  @override
  Future<List<Never>> products({String type = '', int limit = 10}) async => [];
}

/// Records calls; OTP "123456" is the only valid code.
class FakeAuthRepo extends AuthRepository {
  FakeAuthRepo() : super(ApiClient());
  final calls = <String>[];
  String? failSendWith;

  @override
  Future<void> sendOtp(String mobile) async {
    calls.add('sendOtp:$mobile');
    if (failSendWith != null) throw ApiException(failSendWith!, statusCode: 400);
  }

  @override
  Future<void> register({required String mobile, required String fullName, required String email, required AccountType type, String firmName = '', String partnerCode = ''}) async {
    calls.add('register:$mobile:$fullName:$email:${type.id}:$firmName:$partnerCode');
  }

  @override
  Future<Map<String, dynamic>> verifyOtp(String mobile, String otp) async {
    calls.add('verify:$mobile:$otp');
    if (otp != '123456') throw ApiException('Invalid OTP', statusCode: 400);
    return {'token': 'tok_test', 'full_name': 'Test User', 'mobile': mobile};
  }
}

Future<ProviderContainer> pumpApp(WidgetTester t, {FakeAuthRepo? auth, Map<String, Object> prefs = const {}, String start = Routes.home}) async {
  t.view.physicalSize = const Size(390 * 3, 844 * 3);
  t.view.devicePixelRatio = 3;
  addTearDown(t.view.reset);
  SharedPreferences.setMockInitialValues(prefs);
  final sp = await SharedPreferences.getInstance();
  final container = ProviderContainer(overrides: [
    sharedPrefsProvider.overrideWithValue(sp),
    homeRepositoryProvider.overrideWithValue(FakeHomeRepo()),
    authRepositoryProvider.overrideWithValue(auth ?? FakeAuthRepo()),
  ]);
  addTearDown(container.dispose);
  await t.pumpWidget(UncontrolledProviderScope(container: container, child: const FixPapaApp()));
  appRouter.go(start); // router is app-global; reset between tests
  await t.pumpAndSettle();
  return container;
}
