import 'package:customerapp/core/session/session_controller.dart';
import 'package:customerapp/router/app_router.dart';
import 'package:customerapp/shared/widgets/app_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'support/test_app.dart';

Finder _field(String label) =>
    find.descendant(of: find.ancestor(of: find.text(label), matching: find.byType(Column)).first, matching: find.byType(TextField));

Future<void> _tapButton(WidgetTester t, String label) async {
  final f = find.widgetWithText(AppButton, label);
  await t.ensureVisible(f);
  await t.pumpAndSettle();
  await t.tap(f);
  await t.pumpAndSettle();
}

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  testWidgets('home Login pill opens the Login screen', (t) async {
    await pumpApp(t);
    await t.tap(find.text('Login'));
    await t.pumpAndSettle();
    expect(find.text('Welcome back'), findsOneWidget);
  });

  testWidgets('login validates the mobile number like the RN app', (t) async {
    final auth = FakeAuthRepo();
    await pumpApp(t, auth: auth, start: Routes.login);
    await _tapButton(t, 'Login with OTP');
    expect(find.text('Mobile number cannot be empty'), findsOneWidget);

    await t.enterText(_field('Mobile number'), '12345');
    await _tapButton(t, 'Login with OTP');
    expect(find.text('Please enter a valid mobile number'), findsOneWidget);
    expect(auth.calls, isEmpty);
  });

  testWidgets('login shows the server message under the field', (t) async {
    final auth = FakeAuthRepo()..failSendWith = 'Mobile number is not registered';
    await pumpApp(t, auth: auth, start: Routes.login);
    await t.enterText(_field('Mobile number'), '9876543210');
    await _tapButton(t, 'Login with OTP');
    expect(find.text('Mobile number is not registered'), findsOneWidget);
    expect(find.text('Verify your number'), findsNothing);
  });

  testWidgets('login → OTP → wrong code → right code → home, session saved', (t) async {
    final auth = FakeAuthRepo();
    final container = await pumpApp(t, auth: auth, start: Routes.login);

    await t.enterText(_field('Mobile number'), '9876543210');
    await _tapButton(t, 'Login with OTP');
    expect(auth.calls, ['sendOtp:9876543210']);
    expect(find.text('Verify your number'), findsOneWidget);
    expect(find.textContaining('+91 98765 43210', findRichText: true), findsOneWidget);

    // Typing all 6 digits auto-submits.
    await t.enterText(find.byType(TextField), '111111');
    await t.pumpAndSettle();
    expect(find.text('Invalid OTP'), findsOneWidget);

    await t.enterText(find.byType(TextField), '123456');
    await t.pumpAndSettle();
    expect(auth.calls.last, 'verify:9876543210:123456');

    // Back on Home, signed in: Login pill replaced by account button.
    expect(find.text('Login'), findsNothing);
    expect(find.byTooltip('Account'), findsOneWidget);
    expect(container.read(isLoggedInProvider), isTrue);
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString('session.user'), contains('tok_test'));
  });

  testWidgets('OTP resend unlocks after 30 seconds and re-sends', (t) async {
    final auth = FakeAuthRepo();
    await pumpApp(t, auth: auth, start: '${Routes.otp}?mobile=9876543210');
    expect(find.text('Resend OTP'), findsNothing);
    await t.pump(const Duration(seconds: 31));
    await t.pumpAndSettle();
    await t.tap(find.text('Resend OTP'));
    await t.pumpAndSettle();
    expect(auth.calls, ['sendOtp:9876543210']);
    expect(find.text('Resend OTP'), findsNothing); // timer restarted
  });

  testWidgets('saved session is restored on launch', (t) async {
    final container = await pumpApp(t, prefs: {'session.user': '{"token":"tok_saved","mobile":"9876543210"}'});
    expect(container.read(isLoggedInProvider), isTrue);
    expect(find.byTooltip('Account'), findsOneWidget);
  });

  testWidgets('register: firm needs a firm name, then goes to OTP with all fields', (t) async {
    final auth = FakeAuthRepo();
    await pumpApp(t, auth: auth, start: Routes.register);

    await _tapButton(t, 'Register now');
    expect(find.text('Please enter your name'), findsOneWidget);
    expect(find.text('Please enter your mobile number'), findsOneWidget);
    expect(find.text('Please enter your email'), findsOneWidget);

    // Customer type dropdown → bottom sheet → Firm / Business
    await t.ensureVisible(find.text('Individual'));
    await t.tap(find.text('Individual'));
    await t.pumpAndSettle();
    expect(find.text('Select customer type'), findsOneWidget);
    expect(find.text('Government Organisation'), findsOneWidget);
    await t.tap(find.text('Firm / Business'));
    await t.pumpAndSettle();
    expect(find.text('Select customer type'), findsNothing);
    await t.enterText(_field('Full name'), 'Asha Rao');
    await t.enterText(_field('Mobile number'), '9876543210');
    await t.enterText(_field('Email address'), 'asha@example.com');
    await _tapButton(t, 'Register now');
    expect(find.text('Please enter your firm name'), findsOneWidget);
    expect(auth.calls, isEmpty);

    await t.enterText(_field('Firm / business name'), 'Rao Traders');
    await t.enterText(_field('Partner code (optional)'), 'P42');
    await _tapButton(t, 'Register now');
    expect(auth.calls, ['register:9876543210:Asha Rao:asha@example.com:firm:Rao Traders:P42']);
    expect(find.text('Verify your number'), findsOneWidget);
  });

  testWidgets('register: individual sends no firm fields', (t) async {
    final auth = FakeAuthRepo();
    await pumpApp(t, auth: auth, start: Routes.register);
    expect(find.text('Firm / business name'), findsNothing);
    await t.enterText(_field('Full name'), 'Asha');
    await t.enterText(_field('Mobile number'), '9876543210');
    await t.enterText(_field('Email address'), 'asha@example.com');
    await _tapButton(t, 'Register now');
    expect(auth.calls, ['register:9876543210:Asha:asha@example.com:individual::']);
  });
}
