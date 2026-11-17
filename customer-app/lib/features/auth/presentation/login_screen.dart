import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../router/app_router.dart';
import '../../../shared/widgets/ui.dart';
import '../data/auth_repository.dart';

/// 01 · Login or sign up — design-html/02-auth-v2.html. Mobile → send OTP → OTP screen.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key, this.returnBack = false});

  /// Pop back with `true` after login instead of going Home (used by Book a Repair).
  final bool returnBack;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _mobile = TextEditingController();
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _mobile.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final err = Validators.mobile(_mobile.text);
    if (err != null) return setState(() => _error = err);
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);
    try {
      final mobile = _mobile.text.trim();
      await ref.read(authRepositoryProvider).sendOtp(mobile);
      if (!mounted) return;
      final ok = await context.push<bool>(Uri(path: Routes.otp, queryParameters: {'mobile': mobile, if (widget.returnBack) 'next': 'back'}).toString());
      if (ok == true && mounted && widget.returnBack) context.pop(true);
    } on ApiException catch (e) {
      if (mounted) e.network ? showToast(context, e.message) : setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (_, c) => SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: c.maxHeight),
              child: IntrinsicHeight(
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  AuthHero(onClose: context.canPop() ? () => context.pop() : null),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 6, 24, 24),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        Text('Login or sign up', style: AppText.head(26, height: 1.25)),
                        const SizedBox(height: 6),
                        Text("We'll send a one-time code to verify your number.", style: AppText.body(14, color: AppColors.ink3, height: 1.4)),
                        const FieldLabel('Mobile number', top: 22),
                        FpField(
                          controller: _mobile,
                          hint: '98765 43210',
                          prefix: const PhonePrefix(),
                          keyboardType: TextInputType.phone,
                          digitsOnly: true,
                          maxLength: 10,
                          autofillHints: const [AutofillHints.telephoneNumberNational],
                          textInputAction: TextInputAction.done,
                          error: _error,
                          onChanged: (_) => _error == null ? null : setState(() => _error = null),
                          onSubmitted: (_) => _submit(),
                        ),
                        const SizedBox(height: 18),
                        FpButton(label: 'Get OTP', loading: _loading, onPressed: _submit),
                        const SizedBox(height: 18),
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.lock_outline_rounded, size: 13, color: AppColors.green),
                          const SizedBox(width: 5),
                          Text('Secure login', style: AppText.body(11.5, color: AppColors.ink3)),
                          const SizedBox(width: 16),
                          const Icon(Icons.verified_user_outlined, size: 13, color: AppColors.green),
                          const SizedBox(width: 5),
                          Text('No spam calls', style: AppText.body(11.5, color: AppColors.ink3)),
                        ]),
                        const Spacer(),
                        const SizedBox(height: 20),
                        Center(
                          child: GestureDetector(
                            onTap: () async {
                              final ok = await context.push<bool>(Uri(path: Routes.register, queryParameters: {if (widget.returnBack) 'next': 'back'}).toString());
                              if (ok == true && context.mounted && widget.returnBack) context.pop(true);
                            },
                            child: Text.rich(TextSpan(children: [
                              TextSpan(text: 'New to FixPapa? ', style: AppText.body(14, color: AppColors.ink3)),
                              TextSpan(text: 'Create account', style: AppText.body(14, weight: FontWeight.w700, color: AppColors.primary)),
                            ])),
                          ),
                        ),
                      ]),
                    ),
                  ),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// `.ahero` — peach gradient, soft rings, logo, tagline and three floating device cards.
class AuthHero extends StatelessWidget {
  const AuthHero({super.key, this.onClose});
  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context) {
    // (art, left, top, rotation°) on a 390-wide canvas, as in the design.
    const floats = [('laptop', 214.0, 92.0, -6.0), ('printer', 290.0, 176.0, 6.0), ('cctv', 196.0, 196.0, 4.0)];
    return SizedBox(
      height: 300,
      child: LayoutBuilder(builder: (_, c) {
        final dx = c.maxWidth - 390;
        return Stack(clipBehavior: Clip.hardEdge, children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [AppColors.primarySoft, Colors.white])),
            ),
          ),
          for (final d in const [180.0, 300.0, 420.0])
            Positioned(
              left: 290 + dx - d / 2,
              top: 170 - d / 2,
              child: Container(
                width: d,
                height: d,
                decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.primary.withValues(alpha: .14))),
              ),
            ),
          for (final f in floats)
            Positioned(
              left: f.$2 + dx,
              top: f.$3,
              child: Transform.rotate(
                angle: f.$4 * math.pi / 180,
                child: Container(
                  width: 92,
                  height: 80,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: const [BoxShadow(color: Color(0x140B1220), blurRadius: 30, offset: Offset(0, 10))],
                  ),
                  child: DeviceArt(f.$1, width: 70),
                ),
              ),
            ),
          Positioned(left: 24, top: 56, child: Image.asset('assets/images/logo.png', height: 26)),
          Positioned(
            left: 24,
            top: 104,
            child: Text('Repairs, rentals &\nrefurbished tech', style: AppText.head(15, weight: FontWeight.w700, color: AppColors.ink3, height: 1.33)),
          ),
          if (onClose != null) Positioned(right: 16, top: 12, child: RoundIconButton(icon: Icons.close_rounded, tooltip: 'Close', onTap: onClose!)),
        ]);
      }),
    );
  }
}
