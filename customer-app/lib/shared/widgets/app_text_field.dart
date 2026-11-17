import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';

/// Labelled input: soft gray fill at rest, white + orange ring on focus,
/// red ring + message on error. Optional "+91"-style prefix.
class AppTextField extends StatefulWidget {
  const AppTextField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.icon,
    this.prefixText,
    this.error,
    this.keyboardType,
    this.maxLength,
    this.digitsOnly = false,
    this.textInputAction = TextInputAction.next,
    this.autofillHints,
    this.onChanged,
    this.onSubmitted,
    this.autofocus = false,
    this.textCapitalization = TextCapitalization.none,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final IconData? icon;
  final String? prefixText;
  final String? error;
  final TextInputType? keyboardType;
  final int? maxLength;
  final bool digitsOnly;
  final TextInputAction textInputAction;
  final Iterable<String>? autofillHints;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool autofocus;
  final TextCapitalization textCapitalization;

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final focused = _focus.hasFocus;
    final hasError = widget.error != null;
    final ring = hasError ? AppColors.error : (focused ? AppColors.primary : Colors.transparent);

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(widget.label, style: AppText.label),
      const SizedBox(height: 8),
      AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        height: 56,
        decoration: BoxDecoration(
          color: focused || hasError ? AppColors.white : AppColors.gray2,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: ring, width: 1.5),
          boxShadow: focused && !hasError
              ? [BoxShadow(color: AppColors.primary.withValues(alpha: .12), blurRadius: 0, spreadRadius: 4)]
              : null,
        ),
        child: Row(children: [
          const SizedBox(width: 16),
          if (widget.icon != null) ...[
            Icon(widget.icon, size: 20, color: focused ? AppColors.primary : AppColors.ink3),
            const SizedBox(width: 12),
          ],
          if (widget.prefixText != null) ...[
            Text(widget.prefixText!, style: AppText.body(15, weight: FontWeight.w600, color: AppColors.ink)),
            Container(width: 1, height: 22, margin: const EdgeInsets.symmetric(horizontal: 12), color: AppColors.borderStrong),
          ],
          Expanded(
            child: TextField(
              controller: widget.controller,
              focusNode: _focus,
              autofocus: widget.autofocus,
              keyboardType: widget.keyboardType,
              textInputAction: widget.textInputAction,
              textCapitalization: widget.textCapitalization,
              autofillHints: widget.autofillHints,
              onChanged: widget.onChanged,
              onSubmitted: widget.onSubmitted,
              inputFormatters: [
                if (widget.digitsOnly) FilteringTextInputFormatter.digitsOnly,
                if (widget.maxLength != null) LengthLimitingTextInputFormatter(widget.maxLength),
              ],
              style: AppText.body(15, weight: FontWeight.w500, color: AppColors.ink),
              cursorColor: AppColors.primary,
              decoration: InputDecoration(
                isCollapsed: true,
                filled: false,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                hintText: widget.hint,
                hintStyle: AppText.body(15, color: AppColors.ink3.withValues(alpha: .65)),
              ),
            ),
          ),
          const SizedBox(width: 16),
        ]),
      ),
      AnimatedSize(
        duration: const Duration(milliseconds: 180),
        child: hasError
            ? Padding(
                padding: const EdgeInsets.only(top: 6, left: 4),
                child: Row(children: [
                  const Icon(Icons.error_outline_rounded, size: 15, color: AppColors.error),
                  const SizedBox(width: 6),
                  Expanded(child: Text(widget.error!, style: AppText.body(12.5, color: AppColors.error))),
                ]),
              )
            : const SizedBox(width: double.infinity),
      ),
    ]);
  }
}
