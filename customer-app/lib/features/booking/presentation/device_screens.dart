import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../router/app_router.dart';
import '../../../shared/widgets/ui.dart';
import '../data/booking_draft.dart';
import '../data/booking_models.dart';
import '../data/booking_repository.dart';
import 'booking_ui.dart';

/// 01 · What needs fixing? — all repair categories with the website illustrations.
class RepairCategoryScreen extends ConsumerStatefulWidget {
  const RepairCategoryScreen({super.key});

  @override
  ConsumerState<RepairCategoryScreen> createState() => _RepairCategoryScreenState();
}

class _RepairCategoryScreenState extends ConsumerState<RepairCategoryScreen> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(repairCategoriesProvider);
    return BookingScaffold(
      step: 0,
      body: ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 32), children: [
        const BookingTitle('What needs fixing?', subtitle: 'Pick your device. Engineer visits at your doorstep.'),
        const SizedBox(height: 16),
        _SearchBox(hint: 'Search device, e.g. printer', onChanged: (v) => setState(() => _q = v.trim().toLowerCase())),
        AsyncFill(
          value: cats,
          onRetry: () => ref.invalidate(repairCategoriesProvider),
          data: (list) {
            final shown = list.where((c) => _q.isEmpty || c.name.toLowerCase().contains(_q)).toList();
            return TileGrid(children: [
              for (final c in shown)
                Material(
                  color: AppColors.bg2,
                  borderRadius: BorderRadius.circular(18),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () {
                      ref.read(bookingDraftProvider.notifier).setCategory(c);
                      context.push(Uri(path: Routes.repairBrand, queryParameters: {'from': 'list'}).toString());
                    },
                    child: SizedBox(
                      height: 104,
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        DeviceArt(c.art, width: 64),
                        const SizedBox(height: 6),
                        Text(c.name, style: AppText.body(12.5, weight: FontWeight.w600, color: AppColors.ink, height: 1.2)),
                      ]),
                    ),
                  ),
                ),
            ]);
          },
        ),
      ]),
    );
  }
}

/// 02–15 · Select the brand — live brands for the chosen category. A category with a
/// single brand (Apple) skips straight to the problem step.
class RepairBrandScreen extends ConsumerStatefulWidget {
  const RepairBrandScreen({super.key, this.categoryId, this.fromList = false});

  /// Set when opened from a Home tile (no category picked yet).
  final int? categoryId;
  final bool fromList;

  @override
  ConsumerState<RepairBrandScreen> createState() => _RepairBrandScreenState();
}

class _RepairBrandScreenState extends ConsumerState<RepairBrandScreen> {
  String _q = '';
  bool _skipped = false;

  void _change() => widget.fromList ? context.pop() : context.pushReplacement(Routes.bookARepair);

  void _continue() => context.push(Routes.repairProblem);

  @override
  Widget build(BuildContext context) {
    final draft = ref.watch(bookingDraftProvider);
    var cat = draft.category;

    // Opened from Home with ?cat=ID — pick that category once the list is loaded.
    if (widget.categoryId != null && cat?.id != widget.categoryId) {
      final all = ref.watch(repairCategoriesProvider).valueOrNull;
      final found = all?.where((c) => c.id == widget.categoryId).firstOrNull;
      if (found != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) => ref.read(bookingDraftProvider.notifier).setCategory(found));
      }
      return const BookingScaffold(step: 0, body: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.4)));
    }
    if (cat == null) return const BookingScaffold(step: 0, body: SizedBox());

    final brands = ref.watch(repairBrandsProvider(cat.id));
    final list = brands.valueOrNull;
    if (list != null && list.length == 1 && !_skipped) {
      _skipped = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(bookingDraftProvider.notifier).setBrand(list.first, skipped: true);
        context.pushReplacement(Routes.repairProblem);
      });
    }
    final selected = draft.brand;

    return BookingScaffold(
      step: 0,
      body: ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 24), children: [
        ChosenDeviceCard(category: cat, onChange: _change),
        const BookingTitle('Select the brand'),
        const SizedBox(height: 16),
        _SearchBox(
          hint: 'Search ${cat.name == cat.name.toUpperCase() || cat.name.contains('-') ? cat.name : cat.name.toLowerCase()} brands',
          onChanged: (v) => setState(() => _q = v.trim().toLowerCase()),
        ),
        AsyncFill(
          value: brands,
          onRetry: () => ref.invalidate(repairBrandsProvider(cat.id)),
          data: (all) {
            final shown = [...all.where((b) => _q.isEmpty || b.name.toLowerCase().contains(_q)), RepairBrand.other];
            return TileGrid(children: [
              for (final b in shown)
                SelectTile(
                  label: b.name,
                  dashed: b.isOther,
                  selected: selected != null && selected.id == b.id && selected.rawName == b.rawName,
                  onTap: () => ref.read(bookingDraftProvider.notifier).setBrand(b),
                  child: BrandLogo(b),
                ),
            ]);
          },
        ),
      ]),
      footer: BookingFooter(button: FpButton(label: 'Continue', onPressed: selected == null ? null : _continue)),
    );
  }
}

/// 16 · What's the problem? — live services with the diagnosis price.
class RepairProblemScreen extends ConsumerWidget {
  const RepairProblemScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(bookingDraftProvider);
    final cat = draft.category;
    if (cat == null) return const BookingScaffold(step: 0, body: SizedBox());
    final services = ref.watch(repairServicesProvider(cat.id));
    final picked = draft.service;
    final label = draft.brandSkipped || draft.brand == null ? cat.name : '${cat.name} · ${draft.brand!.name}';

    // Back = previous step (brand, or the device list when the brand step was skipped).
    void change() => context.canPop() ? context.pop() : context.pushReplacement(Routes.bookARepair);

    return BookingScaffold(
      step: 0,
      onBack: change,
      body: ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 24), children: [
        MiniDeviceStrip(art: cat.art, label: label, onChange: change),
        const BookingTitle("What's the problem?", subtitle: 'Final repair cost is shared after diagnosis.', top: 16),
        AsyncFill(
          value: services,
          onRetry: () => ref.invalidate(repairServicesProvider(cat.id)),
          data: (list) => Padding(
            padding: const EdgeInsets.only(top: 14),
            child: Column(children: [
              for (final s in list)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _OptionRow(service: s, on: picked?.id == s.id, onTap: () => ref.read(bookingDraftProvider.notifier).setService(s)),
                ),
            ]),
          ),
        ),
      ]),
      footer: BookingSummaryFooter(
        label: 'Diagnosis charge',
        value: picked == null ? '—' : inr(picked.price),
        button: FpButton(label: 'Continue', onPressed: picked == null ? null : () => context.push(Routes.repairIssue)),
      ),
    );
  }
}

class _OptionRow extends StatelessWidget {
  const _OptionRow({required this.service, required this.on, required this.onTap});
  final RepairService service;
  final bool on;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: on ? AppColors.primarySoft : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: on ? AppColors.primary : AppColors.line, width: 1.5)),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 62),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 14, 8),
              child: Row(children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: on ? Colors.white : AppColors.bg2, borderRadius: BorderRadius.circular(12)),
                  child: Icon(serviceIcon(service.name), size: 21, color: on ? AppColors.primary : AppColors.ink3),
                ),
                const SizedBox(width: 12),
                Expanded(child: Text(service.name, style: AppText.body(14.5, weight: FontWeight.w600, color: AppColors.ink, height: 1.3))),
                const SizedBox(width: 8),
                Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text(inr(service.price), style: AppText.head(15)),
                  Text(service.subServiceName.toLowerCase(), style: AppText.body(10.5, color: AppColors.muted, height: 1.3)),
                ]),
              ]),
            ),
          ),
        ),
      );
}

/// `.search` — grey 48px search box.
class _SearchBox extends StatelessWidget {
  const _SearchBox({required this.hint, required this.onChanged});
  final String hint;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) => Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(color: AppColors.bg2, borderRadius: BorderRadius.circular(14)),
        child: Row(children: [
          const Icon(Icons.search_rounded, size: 19, color: AppColors.muted),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              onChanged: onChanged,
              cursorColor: AppColors.primary,
              style: AppText.body(14, color: AppColors.ink, height: 1.3),
              decoration: InputDecoration(
                isDense: true,
                filled: false,
                hintText: hint,
                hintStyle: AppText.body(14, color: AppColors.muted, height: 1.3),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
              ),
            ),
          ),
        ]),
      );
}
