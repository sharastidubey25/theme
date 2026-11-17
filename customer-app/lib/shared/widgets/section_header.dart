import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

/// Website section heading: mono eyebrow, Manrope title with an optional
/// orange highlight word, and an optional "View all" link.
class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.eyebrow,
    required this.title,
    this.highlight,
    this.subtitle,
    this.onViewAll,
    this.dark = false,
  });

  final String eyebrow;
  final String title;
  final String? highlight;
  final String? subtitle;
  final VoidCallback? onViewAll;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final ink = dark ? Colors.white : AppColors.ink;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Eyebrow(eyebrow, dark: dark),
              const SizedBox(height: 8),
              Text.rich(
                TextSpan(children: [
                  TextSpan(text: title),
                  if (highlight != null) TextSpan(text: ' $highlight', style: const TextStyle(color: AppColors.primary)),
                ]),
                style: AppText.head(22, color: ink),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Text(subtitle!, style: AppText.body(13, color: dark ? Colors.white70 : AppColors.ink3)),
              ],
            ],
          ),
        ),
        if (onViewAll != null)
          InkWell(
            onTap: onViewAll,
            borderRadius: BorderRadius.circular(999),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 6, 0, 2),
              child: Row(children: [
                Text('View all', style: AppText.head(13.5, weight: FontWeight.w700, color: dark ? Colors.white : AppColors.primary)),
                const SizedBox(width: 4),
                Icon(Icons.arrow_forward_rounded, size: 16, color: dark ? Colors.white : AppColors.primary),
              ]),
            ),
          ),
      ],
    );
  }
}

/// `.eyebrow` — JetBrains Mono, uppercase, wide tracking, with a short bar.
class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key, this.dark = false, this.color});
  final String text;
  final bool dark;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? (dark ? AppColors.primary3 : AppColors.eyebrow);
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 18, height: 2, decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(2))),
      const SizedBox(width: 8),
      Text(text.toUpperCase(), style: AppText.eyebrow(color: c)),
    ]);
  }
}
