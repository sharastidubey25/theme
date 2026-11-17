import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/net_image.dart';
import '../../../shared/widgets/ui.dart';
import '../data/booking_models.dart';

/// Shared pieces of the Book a Repair v2 screens — mirror design-html/05-book-repair-v2.html
/// (.bar, .prog, .chosen, .mini, .foot, .foot2, .opt, .brand). Change both together.

const bookingSteps = ['Device', 'Issue', 'Visit', 'Confirm'];

/// Page with the "Book a repair · Step n of 4" bar, the 4-part progress and a fixed footer.
class BookingScaffold extends StatelessWidget {
  const BookingScaffold({super.key, required this.step, required this.body, this.footer, this.title = 'Book a repair', this.onBack, this.showProgress = true});
  final int step;
  final Widget body;
  final Widget? footer;
  final String title;
  final VoidCallback? onBack;
  final bool showProgress;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
            child: Row(children: [
              RoundIconButton(icon: Icons.chevron_left_rounded, tooltip: 'Back', onTap: onBack ?? () => Navigator.maybePop(context)),
              const SizedBox(width: 12),
              Expanded(child: Text(title, style: AppText.head(17))),
              if (showProgress) Text('Step ${step + 1} of 4', style: AppText.body(12.5, weight: FontWeight.w600, color: AppColors.muted)),
            ]),
          ),
          if (showProgress) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Row(children: [
                for (var i = 0; i < 4; i++) ...[
                  if (i > 0) const SizedBox(width: 6),
                  Expanded(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      height: 4,
                      decoration: BoxDecoration(color: i <= step ? AppColors.primary : AppColors.line, borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                ],
              ]),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 7, 20, 0),
              child: Row(children: [
                for (var i = 0; i < 4; i++)
                  Expanded(
                    child: Text(bookingSteps[i],
                        style: AppText.body(11, weight: i == step ? FontWeight.w700 : FontWeight.w500, color: i == step ? AppColors.primary : AppColors.muted, height: 1.2)),
                  ),
              ]),
            ),
          ],
          Expanded(child: body),
          ?footer,
        ]),
      ),
    );
  }
}

/// Big screen title + optional subtitle (.btitle / .bsub).
class BookingTitle extends StatelessWidget {
  const BookingTitle(this.title, {super.key, this.subtitle, this.top = 20});
  final String title;
  final String? subtitle;
  final double top;

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(top: top),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: AppText.head(24, height: 1.25)),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: AppText.body(13.5, color: AppColors.ink3, height: 1.4)),
          ],
        ]),
      );
}

/// `.chosen` — peach card with the device art, "Device / Laptop repair" and a Change pill.
class ChosenDeviceCard extends StatelessWidget {
  const ChosenDeviceCard({super.key, required this.category, required this.onChange});
  final RepairCategory category;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) => Container(
        height: 76,
        margin: const EdgeInsets.only(top: 16),
        padding: const EdgeInsets.fromLTRB(8, 0, 14, 0),
        decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(18)),
        child: Row(children: [
          DeviceArt(category.art, width: 64),
          const SizedBox(width: 12),
          Expanded(
            child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Device', style: AppText.body(11.5, weight: FontWeight.w600, color: AppColors.primary, height: 1.2)),
              const SizedBox(height: 2),
              Text('${category.name} repair', style: AppText.head(16)),
            ]),
          ),
          Material(
            color: Colors.white,
            shape: const StadiumBorder(),
            child: InkWell(
              customBorder: const StadiumBorder(),
              onTap: onChange,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(children: [
                  const Icon(Icons.edit_outlined, size: 14, color: AppColors.ink2),
                  const SizedBox(width: 5),
                  Text('Change', style: AppText.body(12.5, weight: FontWeight.w600, color: AppColors.ink2, height: 1.2)),
                ]),
              ),
            ),
          ),
        ]),
      );
}

/// `.mini` — grey strip "Laptop · Acer   Change".
class MiniDeviceStrip extends StatelessWidget {
  const MiniDeviceStrip({super.key, required this.art, required this.label, required this.onChange});
  final String art;
  final String label;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) => Container(
        height: 52,
        margin: const EdgeInsets.only(top: 16),
        padding: const EdgeInsets.fromLTRB(6, 0, 12, 0),
        decoration: BoxDecoration(color: AppColors.bg2, borderRadius: BorderRadius.circular(14)),
        child: Row(children: [
          DeviceArt(art, width: 44),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: AppText.body(14, weight: FontWeight.w600, color: AppColors.ink, height: 1.2))),
          GestureDetector(onTap: onChange, child: Text('Change', style: AppText.body(12.5, weight: FontWeight.w600, color: AppColors.primary))),
        ]),
      );
}

/// `.foot` — "Genuine parts · 90-day repair warranty" + full-width button.
class BookingFooter extends StatelessWidget {
  const BookingFooter({super.key, required this.button, this.hint = true});
  final Widget button;
  final bool hint;

  @override
  Widget build(BuildContext context) => Container(
        padding: EdgeInsets.fromLTRB(20, 14, 20, 14 + MediaQuery.paddingOf(context).bottom),
        decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.line))),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          if (hint)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Icon(Icons.verified_user_outlined, size: 14, color: AppColors.green),
                const SizedBox(width: 6),
                Text('Genuine parts · 90-day repair warranty', style: AppText.body(12, color: AppColors.ink3, height: 1.2)),
              ]),
            ),
          button,
        ]),
      );
}

/// `.foot2` — small "key / value" on the left, button on the right.
class BookingSummaryFooter extends StatelessWidget {
  const BookingSummaryFooter({super.key, required this.button, this.label, this.value});
  final Widget button;
  final String? label;
  final String? value;

  @override
  Widget build(BuildContext context) => Container(
        padding: EdgeInsets.fromLTRB(20, 12, 20, 12 + MediaQuery.paddingOf(context).bottom),
        decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.line))),
        child: Row(children: [
          if (label != null) ...[
            Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(label!, style: AppText.body(11.5, color: AppColors.muted, height: 1.2)),
              const SizedBox(height: 2),
              Text(value ?? '', style: AppText.head(17)),
            ]),
            const SizedBox(width: 14),
          ],
          Expanded(child: button),
        ]),
      );
}

/// `.brand` tile — logo (or device art) + name; selected = orange border, peach fill, tick.
class SelectTile extends StatelessWidget {
  const SelectTile({super.key, required this.label, required this.selected, required this.onTap, required this.child, this.dashed = false});
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Widget child;
  final bool dashed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.primarySoft : (dashed ? AppColors.bg2 : Colors.white),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: selected ? AppColors.primary : (dashed ? AppColors.borderStrong : AppColors.line), width: 1.5),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: SizedBox(
          height: 92,
          child: Stack(children: [
            Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                SizedBox(height: 30, child: Center(child: child)),
                const SizedBox(height: 10),
                Text(label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppText.body(12, weight: FontWeight.w600, color: selected ? AppColors.ink : AppColors.ink3, height: 1.2)),
              ]),
            ),
            if (selected)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                  child: const Icon(Icons.check_rounded, size: 13, color: Colors.white),
                ),
              ),
          ]),
        ),
      ),
    );
  }
}

/// Brand logo: local website asset when we have one, else the live CDN logo.
class BrandLogo extends StatelessWidget {
  const BrandLogo(this.brand, {super.key});
  final RepairBrand brand;

  @override
  Widget build(BuildContext context) {
    if (brand.isOther) return const Icon(Icons.add_rounded, size: 24, color: AppColors.ink3);
    final local = brand.localAsset;
    if (local != null) {
      return local.endsWith('.svg')
          ? SvgPicture.asset(local, width: 62, height: 30, fit: BoxFit.contain)
          : Image.asset(local, width: 62, height: 30, fit: BoxFit.contain);
    }
    if (brand.logo.isEmpty) return Text(brand.name, style: AppText.head(15));
    return NetImage(brand.logoUrl, width: 62, height: 30, fit: BoxFit.contain, background: Colors.transparent);
  }
}

/// 3-column grid with 10px gaps (.grid).
class TileGrid extends StatelessWidget {
  const TileGrid({super.key, required this.children, this.top = 16});
  final List<Widget> children;
  final double top;

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.only(top: top),
        child: LayoutBuilder(builder: (_, c) {
          final w = (c.maxWidth - 20) / 3;
          return Wrap(spacing: 10, runSpacing: 10, children: [for (final ch in children) SizedBox(width: w, child: ch)]);
        }),
      );
}

/// Same keyword → icon map as svc_icon() in design-html/_generators/gen_flows_v2.py.
IconData serviceIcon(String name) {
  final t = name.toLowerCase();
  const map = [
    ('software', Icons.code_rounded),
    ('display', Icons.desktop_windows_outlined),
    ('screen', Icons.desktop_windows_outlined),
    ('motherboard', Icons.memory_rounded),
    ('hardware', Icons.memory_rounded),
    ('damage', Icons.broken_image_outlined),
    ('power', Icons.bolt_rounded),
    ('battery', Icons.bolt_rounded),
    ('other', Icons.help_outline_rounded),
  ];
  for (final (k, v) in map) {
    if (t.contains(k)) return v;
  }
  return Icons.build_outlined;
}

/// Loading / error placeholder for API-backed steps.
class AsyncFill<T> extends StatelessWidget {
  const AsyncFill({super.key, required this.value, required this.data, required this.onRetry});
  final AsyncValue<T> value;
  final Widget Function(T) data;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => value.when(
        data: data,
        loading: () => const Padding(
          padding: EdgeInsets.only(top: 48),
          child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.4)),
        ),
        error: (e, _) => Padding(
          padding: const EdgeInsets.only(top: 40),
          child: Column(children: [
            const Icon(Icons.wifi_off_rounded, color: AppColors.muted, size: 32),
            const SizedBox(height: 10),
            Text('$e', textAlign: TextAlign.center, style: AppText.body(13.5, color: AppColors.ink3)),
            TextButton(onPressed: onRetry, child: const Text('Try again')),
          ]),
        ),
      );
}
