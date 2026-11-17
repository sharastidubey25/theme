import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../router/app_router.dart';
import 'app_button.dart';

/// Replaces the RN "Login required" modal.
Future<void> showLoginRequired(BuildContext context, {String? message}) {
  return showModalBottomSheet(
    context: context,
    backgroundColor: Colors.white,
    showDragHandle: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    builder: (sheet) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(color: AppColors.primarySoft, shape: BoxShape.circle),
            child: const Icon(Icons.lock_outline_rounded, color: AppColors.primary, size: 26),
          ),
          const SizedBox(height: 16),
          Text('Login required', style: AppText.h2),
          const SizedBox(height: 6),
          Text(message ?? 'Please login or register first to continue.', style: AppText.bodyM, textAlign: TextAlign.center),
          const SizedBox(height: 24),
          AppButton(
            label: 'Login',
            expand: true,
            trailingArrow: true,
            onPressed: () {
              Navigator.pop(sheet);
              context.push(Routes.login);
            },
          ),
          const SizedBox(height: 10),
          AppButton(label: 'Not now', variant: AppButtonVariant.ghost, expand: true, onPressed: () => Navigator.pop(sheet)),
        ]),
      ),
    ),
  );
}
