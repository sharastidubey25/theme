import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

enum AppButtonVariant { primary, dark, ghost, light }

enum AppButtonSize { md, sm }

/// Pill button from the website (`.btn`): 52px tall, Manrope 700,
/// orange gradient with glow for the primary variant.
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.icon,
    this.trailingArrow = false,
    this.expand = false,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final IconData? icon;
  final bool trailingArrow;
  final bool expand;

  /// Shows a spinner and ignores taps.
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final h = size == AppButtonSize.md ? 52.0 : 40.0;
    final fs = size == AppButtonSize.md ? 15.0 : 13.5;
    final (Gradient? grad, Color? bg, Color fg, Border? border, List<BoxShadow>? shadow) = switch (variant) {
      AppButtonVariant.primary => (AppColors.gradPrimary, null, Colors.white, null, AppShadows.glow),
      AppButtonVariant.dark => (null, AppColors.navy, Colors.white, null, null),
      AppButtonVariant.ghost => (null, Colors.white, AppColors.ink, Border.all(color: AppColors.borderStrong), null),
      AppButtonVariant.light => (null, Colors.white, AppColors.ink, null, AppShadows.sm),
    };

    final Widget content = loading
        ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: fg))
        : Row(
      mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (icon != null) ...[Icon(icon, size: fs + 3, color: fg), const SizedBox(width: 8)],
        Flexible(
          child: Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppText.head(fs, weight: FontWeight.w700, color: fg, height: 1).copyWith(letterSpacing: .15)),
        ),
        if (trailingArrow) ...[const SizedBox(width: 8), Icon(Icons.arrow_forward_rounded, size: fs + 3, color: fg)],
      ],
    );

    return Opacity(
      opacity: onPressed == null && !loading ? .5 : 1,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: grad,
          color: bg,
          border: border,
          boxShadow: shadow,
          borderRadius: BorderRadius.circular(AppRadius.pill),
        ),
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            onTap: loading ? null : onPressed,
            borderRadius: BorderRadius.circular(AppRadius.pill),
            child: SizedBox(
              height: h,
              width: expand ? double.infinity : null,
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: size == AppButtonSize.md ? 26 : 18),
                child: Center(widthFactor: 1, child: content),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
