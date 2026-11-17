import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_auth/smart_auth.dart';

import '../../../core/network/api_client.dart';
import '../../../core/session/session_controller.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../router/app_router.dart';
import '../../../shared/widgets/ui.dart';
import '../data/auth_repository.dart';

/// 02 · Enter the code — design-html/02-auth-v2.html. 6-digit code, 30 s resend timer,
/// Android SMS auto-read (SMS Retriever), then save session → Home (or pop `true`).
class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.mobile, this.returnBack = false});
  final String mobile;

  /// Pop back with `true` instead of going Home (login from Book a Repair).
  final bool returnBack;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  static const _len = 6;
  static const _resendAfter = 30;

  final _code = TextEditingController();
  final _focus = FocusNode();
  Timer? _timer;
  int _seconds = _resendAfter;
  String? _error;
  bool _verifying = false;
  bool _resending = false;

  bool get _isAndroid => !kIsWeb && Platform.isAndroid;

  @override
  void initState() {
    super.initState();
    _startTimer();
    _listenForSms();
    _focus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _timer?.cancel();
    if (_isAndroid) SmartAuth.instance.removeSmsRetrieverApiListener();
    _code.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _seconds = _resendAfter);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_seconds <= 1) t.cancel();
      if (mounted) setState(() => _seconds--);
    });
  }

  Future<void> _listenForSms() async {
    if (!_isAndroid) return; // iOS fills via AutofillHints.oneTimeCode
    final res = await SmartAuth.instance.getSmsWithRetrieverApi(matcher: r'\d{6}');
    final code = res.data?.code;
    if (!mounted || code == null || code.length != _len) return;
    _code.text = code;
    _verify();
  }

  Future<void> _verify() async {
    final otp = _code.text;
    if (otp.isEmpty) return setState(() => _error = 'OTP cannot be blank');
    if (otp.length < _len) return setState(() => _error = 'Enter all $_len digits');
    setState(() {
      _verifying = true;
      _error = null;
    });
    try {
      final user = await ref.read(authRepositoryProvider).verifyOtp(widget.mobile, otp);
      await ref.read(sessionProvider.notifier).signIn(user);
      if (!mounted) return;
      widget.returnBack ? context.pop(true) : context.go(Routes.home);
    } on ApiException catch (e) {
      if (!mounted) return;
      e.network ? showToast(context, e.message) : setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _resend() async {
    setState(() => _resending = true);
    try {
      await ref.read(authRepositoryProvider).sendOtp(widget.mobile);
      _code.clear();
      setState(() => _error = null);
      _listenForSms();
    } on ApiException catch (e) {
      if (!mounted) return;
      e.network ? showToast(context, e.message) : setState(() => _error = e.message);
    } finally {
      if (mounted) {
        setState(() => _resending = false);
        _startTimer();
      }
    }
  }

  String get _prettyMobile {
    final m = widget.mobile;
    return m.length == 10 ? '+91 ${m.substring(0, 5)} ${m.substring(5)}' : '+91 $m';
  }

  @override
  Widget build(BuildContext context) {
    final complete = _code.text.length == _len;
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 4, 24, 16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Align(alignment: Alignment.centerLeft, child: RoundIconButton(icon: Icons.chevron_left_rounded, tooltip: 'Back', onTap: () => context.pop())),
            Expanded(
              child: ListView(padding: const EdgeInsets.only(top: 22), children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(20)),
                    child: const Icon(Icons.smartphone_rounded, size: 30, color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 20),
                Text('Enter the code', style: AppText.head(26, height: 1.25)),
                const SizedBox(height: 6),
                Text.rich(TextSpan(style: AppText.body(14, color: AppColors.ink3, height: 1.4), children: [
                  const TextSpan(text: 'Sent by SMS to '),
                  TextSpan(text: _prettyMobile, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.ink)),
                  const TextSpan(text: ' · '),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.baseline,
                    baseline: TextBaseline.alphabetic,
                    child: GestureDetector(
                      onTap: () => context.pop(),
                      child: Text('Edit', style: AppText.body(14, weight: FontWeight.w700, color: AppColors.primary, height: 1.4)),
                    ),
                  ),
                ])),
                const SizedBox(height: 26),
                _OtpBoxes(
                  controller: _code,
                  focusNode: _focus,
                  length: _len,
                  hasError: _error != null,
                  onChanged: (v) {
                    if (_error != null) setState(() => _error = null);
                    setState(() {});
                    if (v.length == _len) _verify();
                  },
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(_error!, style: AppText.body(12.5, color: AppColors.error)),
                  ),
                const SizedBox(height: 18),
                Row(children: [
                  const Icon(Icons.schedule_rounded, size: 15, color: AppColors.ink3),
                  const SizedBox(width: 6),
                  if (_seconds > 0)
                    Text.rich(TextSpan(style: AppText.body(13.5, color: AppColors.ink3), children: [
                      const TextSpan(text: 'Resend code in '),
                      TextSpan(text: '0:${_seconds.toString().padLeft(2, '0')}', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.ink)),
                    ]))
                  else if (_resending)
                    const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                  else
                    GestureDetector(
                      onTap: _resend,
                      child: Text('Resend code', style: AppText.body(13.5, weight: FontWeight.w700, color: AppColors.primary)),
                    ),
                ]),
              ]),
            ),
            FpButton(label: 'Verify & continue', icon: null, loading: _verifying, onPressed: complete ? _verify : null),
            const SizedBox(height: 12),
            Text.rich(
              TextSpan(style: AppText.body(12, color: AppColors.muted, height: 1.4), children: const [
                TextSpan(text: 'By continuing you agree to our '),
                TextSpan(text: 'Terms', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.ink3)),
                TextSpan(text: ' & '),
                TextSpan(text: 'Privacy Policy', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.ink3)),
              ]),
              textAlign: TextAlign.center,
            ),
          ]),
        ),
      ),
    );
  }
}

/// Six boxes backed by one hidden TextField, so paste, keyboard deletes and
/// OS one-time-code autofill all work.
class _OtpBoxes extends StatelessWidget {
  const _OtpBoxes({required this.controller, required this.focusNode, required this.length, required this.hasError, required this.onChanged});
  final TextEditingController controller;
  final FocusNode focusNode;
  final int length;
  final bool hasError;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final text = controller.text;
    final active = focusNode.hasFocus ? text.length.clamp(0, length - 1) : -1;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => focusNode.requestFocus(),
      child: Stack(children: [
        // Invisible input that owns the keyboard / autofill.
        Positioned.fill(
          child: Opacity(
            opacity: 0,
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              autofocus: true,
              keyboardType: TextInputType.number,
              autofillHints: const [AutofillHints.oneTimeCode],
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(length)],
              showCursor: false,
              enableInteractiveSelection: false,
              onChanged: onChanged,
              decoration: const InputDecoration(border: InputBorder.none, filled: false, counterText: ''),
            ),
          ),
        ),
        IgnorePointer(
          child: Row(children: [
            for (var i = 0; i < length; i++) ...[
              if (i > 0) const SizedBox(width: 10),
              Expanded(
                child: _Box(
                  char: i < text.length ? text[i] : '',
                  active: i == active,
                  filled: i < text.length,
                  error: hasError,
                ),
              ),
            ],
          ]),
        ),
      ]),
    );
  }
}

class _Box extends StatelessWidget {
  const _Box({required this.char, required this.active, required this.filled, required this.error});
  final String char;
  final bool active;
  final bool filled;
  final bool error;

  @override
  Widget build(BuildContext context) {
    final border = error
        ? AppColors.error
        : active
            ? AppColors.primary
            : filled
                ? AppColors.bg2
                : AppColors.line;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      height: 56,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: filled && !active ? AppColors.bg2 : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border, width: 1.5),
        boxShadow: active && !error ? [BoxShadow(color: AppColors.primary.withValues(alpha: .10), spreadRadius: 4)] : null,
      ),
      child: char.isNotEmpty
          ? Text(char, style: AppText.head(22, color: AppColors.ink))
          : active
              ? Container(width: 2, height: 22, color: AppColors.primary)
              : null,
    );
  }
}
