import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../router/app_router.dart';
import '../../../shared/widgets/ui.dart';
import '../data/auth_repository.dart';

/// 03 · Create your account — design-html/02-auth-v2.html. Creates the account via auth/login, then OTP.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key, this.returnBack = false});

  /// Pop back with `true` after sign-up instead of going Home.
  final bool returnBack;

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final _email = TextEditingController();
  final _firm = TextEditingController();
  final _partner = TextEditingController();
  AccountType _type = AccountType.individual;
  final _errors = <String, String?>{};
  bool _loading = false;

  static const _types = [
    (AccountType.individual, Icons.person_outline_rounded, 'Individual'),
    (AccountType.firm, Icons.apartment_rounded, 'Business'),
    (AccountType.government, Icons.account_balance_outlined, 'Government'),
  ];

  @override
  void dispose() {
    for (final c in [_name, _mobile, _email, _firm, _partner]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _email.text.trim();
    final errs = {
      'name': Validators.required(_name.text, 'Please enter your name'),
      'mobile': Validators.mobile(_mobile.text, empty: 'Please enter your mobile number'),
      'email': email.isEmpty ? null : Validators.email(email),
      'firm': _type != AccountType.individual ? Validators.required(_firm.text, 'Please enter the name') : null,
    };
    setState(() => _errors
      ..clear()
      ..addAll(errs));
    if (errs.values.any((e) => e != null)) return;

    FocusScope.of(context).unfocus();
    setState(() => _loading = true);
    try {
      final mobile = _mobile.text.trim();
      await ref.read(authRepositoryProvider).register(
            mobile: mobile,
            fullName: _name.text.trim(),
            email: email,
            type: _type,
            firmName: _type == AccountType.individual ? '' : _firm.text.trim(),
            partnerCode: _type == AccountType.individual ? '' : _partner.text.trim(),
          );
      if (!mounted) return;
      final ok = await context.push<bool>(Uri(path: Routes.otp, queryParameters: {'mobile': mobile, if (widget.returnBack) 'next': 'back'}).toString());
      if (ok == true && mounted && widget.returnBack) context.pop(true);
    } on ApiException catch (e) {
      if (mounted) e.network ? showToast(context, e.message) : setState(() => _errors['mobile'] = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _clear(String key) {
    if (_errors[key] != null) setState(() => _errors[key] = null);
  }

  @override
  Widget build(BuildContext context) {
    final business = _type != AccountType.individual;
    final validMobile = RegExp(r'^\d{10}$').hasMatch(_mobile.text);
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.fromLTRB(24, 4, 24, 28), children: [
          Align(alignment: Alignment.centerLeft, child: RoundIconButton(icon: Icons.chevron_left_rounded, tooltip: 'Back', onTap: () => context.pop())),
          const SizedBox(height: 18),
          Text('Create your account', style: AppText.head(26, height: 1.25)),
          const SizedBox(height: 6),
          Text('Takes 30 seconds. Book repairs and track them in one place.', style: AppText.body(14, color: AppColors.ink3, height: 1.4)),
          const FieldLabel('I am', top: 22),
          Row(children: [
            for (var i = 0; i < _types.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Expanded(child: _TypeCard(icon: _types[i].$2, label: _types[i].$3, on: _type == _types[i].$1, onTap: () => setState(() => _type = _types[i].$1))),
            ],
          ]),
          const FieldLabel('Full name', top: 22),
          FpField(
            controller: _name,
            hint: 'Your name',
            icon: Icons.person_outline_rounded,
            textCapitalization: TextCapitalization.words,
            autofillHints: const [AutofillHints.name],
            error: _errors['name'],
            onChanged: (_) => _clear('name'),
          ),
          const FieldLabel('Mobile number', top: 22),
          FpField(
            controller: _mobile,
            hint: '98765 43210',
            prefix: const PhonePrefix(),
            suffix: validMobile ? const Icon(Icons.check_rounded, size: 18, color: AppColors.green) : null,
            keyboardType: TextInputType.phone,
            digitsOnly: true,
            maxLength: 10,
            autofillHints: const [AutofillHints.telephoneNumberNational],
            error: _errors['mobile'],
            onChanged: (_) => setState(() => _errors['mobile'] = null),
          ),
          const FieldLabel('Email', hint: 'Optional', top: 22),
          FpField(
            controller: _email,
            hint: 'you@example.com',
            icon: Icons.mail_outline_rounded,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            textInputAction: business ? TextInputAction.next : TextInputAction.done,
            error: _errors['email'],
            onChanged: (_) => _clear('email'),
          ),
          if (business) ...[
            FieldLabel(_type == AccountType.firm ? 'Business name' : 'Organisation name', top: 22),
            FpField(
              controller: _firm,
              hint: _type == AccountType.firm ? 'e.g. Sharma Traders' : 'e.g. District Office',
              icon: Icons.apartment_rounded,
              textCapitalization: TextCapitalization.words,
              autofillHints: const [AutofillHints.organizationName],
              error: _errors['firm'],
              onChanged: (_) => _clear('firm'),
            ),
            const FieldLabel('Partner code', hint: 'Optional', top: 22),
            FpField(controller: _partner, hint: 'If a FixPapa partner referred you', icon: Icons.confirmation_number_outlined, textInputAction: TextInputAction.done),
          ],
          const SizedBox(height: 24),
          FpButton(label: 'Create account', icon: null, loading: _loading, onPressed: _submit),
          const SizedBox(height: 16),
          Center(
            child: GestureDetector(
              onTap: () => context.canPop() ? context.pop() : context.pushReplacement(Routes.login),
              child: Text.rich(TextSpan(children: [
                TextSpan(text: 'Already have an account? ', style: AppText.body(14, color: AppColors.ink3)),
                TextSpan(text: 'Log in', style: AppText.body(14, weight: FontWeight.w700, color: AppColors.primary)),
              ])),
            ),
          ),
        ]),
      ),
    );
  }
}

/// `.seg` card — Individual / Business / Government.
class _TypeCard extends StatelessWidget {
  const _TypeCard({required this.icon, required this.label, required this.on, required this.onTap});
  final IconData icon;
  final String label;
  final bool on;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: on ? AppColors.primarySoft : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: on ? AppColors.primary : AppColors.line, width: 1.5)),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: SizedBox(
            height: 74,
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(icon, size: 22, color: on ? AppColors.primary : AppColors.ink3),
              const SizedBox(height: 6),
              Text(label, style: AppText.body(12.5, weight: FontWeight.w600, color: on ? AppColors.primary : AppColors.ink2, height: 1.2)),
            ]),
          ),
        ),
      );
}
