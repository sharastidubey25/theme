import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/network/api_client.dart';
import '../../../core/session/session_controller.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../router/app_router.dart';
import '../../../shared/widgets/ui.dart';
import '../data/booking_draft.dart';
import '../data/booking_models.dart';
import '../data/booking_repository.dart';
import 'booking_ui.dart';

/// Quick-pick chips per device (they fill the required one-line issue).
List<String> quickPicks(String art) => switch (art) {
      'laptop' || 'desktop' || 'apple' || 'server' => const ['Shuts down', 'Overheating', 'Not turning on', 'Very slow', 'Loud fan', 'Battery drains'],
      'printer' || 'scanner' => const ['Paper jam', 'Not printing', 'Poor quality', 'Not connecting', 'Error light', 'Ink / toner'],
      'cctv' || 'biometric' => const ['No video', 'Device offline', 'Blurry image', 'Not recording', 'Not reading', 'Cable issue'],
      'monitor' || 'projector' || 'tablet' => const ['No display', 'Flickering', 'Lines on screen', 'Cracked', 'No power', 'No signal'],
      'ups' => const ['Not charging', 'Beeping', 'Short backup', 'No power', 'Battery swollen', 'Trips often'],
      _ => const ['No internet', 'Slow speed', 'Keeps dropping', 'Lights off', 'Setup needed', 'Cable issue'],
    };

/// 17 · Tell us more — required one-line issue (RN "taskTitle"), optional details (≤1000) and up to 5 photos.
class RepairIssueScreen extends ConsumerStatefulWidget {
  const RepairIssueScreen({super.key});

  @override
  ConsumerState<RepairIssueScreen> createState() => _RepairIssueScreenState();
}

class _RepairIssueScreenState extends ConsumerState<RepairIssueScreen> {
  static const maxPhotos = 5;
  late final _title = TextEditingController(text: ref.read(bookingDraftProvider).title);
  late final _desc = TextEditingController(text: ref.read(bookingDraftProvider).description);
  late Set<String> _tags = {...ref.read(bookingDraftProvider).tags};
  late List<XFile> _images = [...ref.read(bookingDraftProvider).images];
  String? _error;

  @override
  void dispose() {
    _title.dispose();
    _desc.dispose();
    super.dispose();
  }

  void _toggle(String t) {
    setState(() {
      _tags = _tags.contains(t) ? ({..._tags}..remove(t)) : {..._tags, t};
      final picks = quickPicks(ref.read(bookingDraftProvider).category?.art ?? '');
      final ordered = picks.where(_tags.contains).toList();
      final text = ordered.join(', ');
      _title.text = text.isEmpty ? '' : '${text[0].toUpperCase()}${text.substring(1).toLowerCase()}';
      _error = null;
    });
  }

  Future<void> _addPhoto() async {
    if (_images.length >= maxPhotos) return showToast(context, 'You can add up to $maxPhotos photos');
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(26))),
      builder: (sheet) => const _PhotoSourceSheet(),
    );
    if (source == null) return;
    final f = await ImagePicker().pickImage(source: source, imageQuality: 80, maxWidth: 1600);
    if (f != null && mounted) setState(() => _images = [..._images, f]);
  }

  void _next() {
    if (_title.text.trim().isEmpty) return setState(() => _error = 'Please enter the issue');
    ref.read(bookingDraftProvider.notifier).update((d) => d.copyWith(
          title: _title.text.trim(),
          tags: _tags,
          description: _desc.text.trim(),
          images: _images,
        ));
    context.push(Routes.repairAddress);
  }

  @override
  Widget build(BuildContext context) {
    final art = ref.watch(bookingDraftProvider).category?.art ?? '';
    return BookingScaffold(
      step: 1,
      body: ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 24), children: [
        const BookingTitle('Tell us more', subtitle: 'Helps the engineer bring the right parts.'),
        const FieldLabel("What's the issue?", hint: 'Required'),
        FpField(controller: _title, hint: 'e.g. Laptop shuts down', error: _error, maxLength: 150, onChanged: (_) => setState(() => _error = null)),
        const SizedBox(height: 14),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final t in quickPicks(art)) FpChip(label: t, selected: _tags.contains(t), onTap: () => _toggle(t)),
        ]),
        const FieldLabel('More details', hint: 'Optional'),
        FpField(controller: _desc, hint: 'When did it start? Any error message?', maxLines: 4, minLines: 3, maxLength: 1000, showCounter: true),
        FieldLabel('Photos', hint: 'Optional · ${_images.length}/$maxPhotos'),
        Wrap(spacing: 10, runSpacing: 10, children: [
          for (final f in _images)
            Stack(children: [
              ClipRRect(borderRadius: BorderRadius.circular(14), child: Image.file(File(f.path), width: 76, height: 76, fit: BoxFit.cover)),
              Positioned(
                right: 5,
                top: 5,
                child: GestureDetector(
                  onTap: () => setState(() => _images = [..._images]..remove(f)),
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(color: AppColors.ink.withValues(alpha: .7), shape: BoxShape.circle),
                    child: const Icon(Icons.close_rounded, size: 12, color: Colors.white),
                  ),
                ),
              ),
            ]),
          if (_images.length < maxPhotos)
            GestureDetector(
              onTap: _addPhoto,
              child: Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  color: AppColors.bg2,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.borderStrong, width: 1.5),
                ),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.photo_camera_outlined, size: 20, color: AppColors.ink3),
                  const SizedBox(height: 4),
                  Text('Add', style: AppText.body(11.5, weight: FontWeight.w600, color: AppColors.ink3, height: 1.2)),
                ]),
              ),
            ),
        ]),
      ]),
      footer: BookingSummaryFooter(button: FpButton(label: 'Continue', onPressed: _next)),
    );
  }
}

/// 18 · Add a photo (sheet) — Camera / Gallery / Cancel.
class _PhotoSourceSheet extends StatelessWidget {
  const _PhotoSourceSheet();

  @override
  Widget build(BuildContext context) {
    Widget src(IconData icon, String t, String d, ImageSource s) => Expanded(
          child: Material(
            color: AppColors.bg2,
            borderRadius: BorderRadius.circular(18),
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: () => Navigator.pop(context, s),
              child: SizedBox(
                height: 112,
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(
                    width: 46,
                    height: 46,
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: Icon(icon, size: 22, color: AppColors.primary),
                  ),
                  const SizedBox(height: 6),
                  Text(t, style: AppText.body(14, weight: FontWeight.w700, color: AppColors.ink, height: 1.2)),
                  Text(d, style: AppText.body(11.5, color: AppColors.ink3, height: 1.4)),
                ]),
              ),
            ),
          ),
        );
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.borderStrong, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 18),
          Text('Add a photo', style: AppText.head(19)),
          const SizedBox(height: 4),
          Text('Show the problem: screen, error message or damage.', style: AppText.body(13.5, color: AppColors.ink3)),
          const SizedBox(height: 18),
          Row(children: [
            src(Icons.photo_camera_outlined, 'Camera', 'Take a photo', ImageSource.camera),
            const SizedBox(width: 12),
            src(Icons.image_outlined, 'Gallery', 'Choose from phone', ImageSource.gallery),
          ]),
          const SizedBox(height: 14),
          FpButton(label: 'Cancel', ghost: true, onPressed: () => Navigator.pop(context)),
        ]),
      ),
    );
  }
}

/// 19 · Where should we come? — saved addresses (logged in) or the one typed in this booking.
class RepairAddressScreen extends ConsumerWidget {
  const RepairAddressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draft = ref.watch(bookingDraftProvider);
    final loggedIn = ref.watch(isLoggedInProvider);
    final saved = ref.watch(savedAddressesProvider);
    final picked = draft.address;

    // Pre-select the default address the first time.
    final list = saved.valueOrNull ?? const <ServiceAddress>[];
    if (picked == null && list.isNotEmpty) {
      final def = list.where((a) => a.isDefault).firstOrNull ?? list.first;
      WidgetsBinding.instance.addPostFrameCallback((_) => ref.read(bookingDraftProvider.notifier).update((d) => d.copyWith(address: def)));
    }
    // A guest's typed address (id 0) is shown as a card too.
    final cards = [...list, if (picked != null && picked.id == 0) picked];

    return BookingScaffold(
      step: 2,
      body: ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 24), children: [
        const BookingTitle('Where should we come?', subtitle: 'Pick a saved address or add a new one.'),
        if (cards.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.only(top: 22, bottom: 10),
            child: Text(loggedIn ? 'SAVED ADDRESSES' : 'THIS VISIT', style: AppText.body(12, weight: FontWeight.w700, color: AppColors.muted).copyWith(letterSpacing: .5)),
          ),
          for (final a in cards)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _AddressCard(
                a: a,
                on: picked != null && picked.id == a.id && picked.address == a.address,
                onTap: () => ref.read(bookingDraftProvider.notifier).update((d) => d.copyWith(address: a)),
              ),
            ),
        ] else if (saved.isLoading)
          const Padding(padding: EdgeInsets.only(top: 40), child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.4))),
        const SizedBox(height: 2),
        Material(
          color: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppColors.borderStrong, width: 1.5)),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => context.push(Routes.repairAddAddress),
            child: SizedBox(
              height: 52,
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Icon(Icons.add_rounded, size: 19, color: AppColors.primary),
                const SizedBox(width: 8),
                Text('Add new address', style: AppText.body(14, weight: FontWeight.w600, color: AppColors.primary, height: 1.2)),
              ]),
            ),
          ),
        ),
      ]),
      footer: BookingSummaryFooter(button: FpButton(label: 'Continue', onPressed: picked == null ? null : () => context.push(Routes.repairSlot))),
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({required this.a, required this.on, required this.onTap});
  final ServiceAddress a;
  final bool on;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: on ? AppColors.primarySoft : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: on ? AppColors.primary : AppColors.line, width: 1.5)),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(color: on ? Colors.white : AppColors.bg2, borderRadius: BorderRadius.circular(11)),
                child: Icon(Icons.location_on_outlined, size: 19, color: on ? AppColors.primary : AppColors.ink3),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(a.address, style: AppText.body(14.5, weight: FontWeight.w700, color: AppColors.ink, height: 1.3)),
                  if (a.place.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(a.place, style: AppText.body(12.5, color: AppColors.ink3, height: 1.4)),
                  ],
                  if (a.isDefault)
                    Container(
                      margin: const EdgeInsets.only(top: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: AppColors.greenSoft, borderRadius: BorderRadius.circular(6)),
                      child: Text('Default', style: AppText.body(11, weight: FontWeight.w700, color: AppColors.green, height: 1.4)),
                    ),
                ]),
              ),
              const SizedBox(width: 8),
              FpRadio(on: on),
            ]),
          ),
        ),
      );
}

/// 20 · Add new address — full address, landmark, state, city, pincode, default (RN AddAddress fields).
class RepairAddAddressScreen extends ConsumerStatefulWidget {
  const RepairAddAddressScreen({super.key});

  @override
  ConsumerState<RepairAddAddressScreen> createState() => _RepairAddAddressScreenState();
}

class _RepairAddAddressScreenState extends ConsumerState<RepairAddAddressScreen> {
  final _address = TextEditingController();
  final _street = TextEditingController();
  final _pin = TextEditingController();
  NamedItem? _state;
  NamedItem? _city;
  bool _default = true;
  bool _saving = false;
  final _err = <String, String?>{};

  @override
  void dispose() {
    _address.dispose();
    _street.dispose();
    _pin.dispose();
    super.dispose();
  }

  Future<NamedItem?> _pick(String title, List<NamedItem> items) => showModalBottomSheet<NamedItem>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(26))),
        builder: (_) => _PickerSheet(title: title, items: items),
      );

  Future<void> _save() async {
    final errs = {
      'address': _address.text.trim().isEmpty ? 'Please enter full address' : null,
      'state': _state == null ? 'Please select the state' : null,
      'city': _city == null ? 'Please select the city' : null,
      'pin': RegExp(r'^\d{6}$').hasMatch(_pin.text.trim()) ? null : 'Please enter a 6-digit pincode',
    };
    setState(() => _err
      ..clear()
      ..addAll(errs));
    if (errs.values.any((e) => e != null)) return;

    final a = ServiceAddress(
      id: 0,
      address: _address.text.trim(),
      street: _street.text.trim(),
      stateId: _state!.id,
      cityId: _city!.id,
      pincode: _pin.text.trim(),
      stateName: _state!.name,
      cityName: _city!.name,
    );
    final notifier = ref.read(bookingDraftProvider.notifier);
    if (!ref.read(isLoggedInProvider)) {
      notifier.update((d) => d.copyWith(address: a));
      context.pop();
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(bookingRepositoryProvider).addAddress(a, isDefault: _default);
      ref.invalidate(savedAddressesProvider);
      final list = await ref.read(savedAddressesProvider.future);
      final added = list.where((x) => x.address == a.address && x.pincode == a.pincode).lastOrNull;
      notifier.update((d) => d.copyWith(address: added ?? a));
      if (mounted) context.pop();
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final states = ref.watch(statesProvider);
    final cities = _state == null ? null : ref.watch(citiesProvider(_state!.id));
    final loggedIn = ref.watch(isLoggedInProvider);

    Widget select(String label, String? value, String? error, VoidCallback? onTap) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          FieldLabel(label, top: 14),
          GestureDetector(
            onTap: onTap,
            child: Container(
              height: 50,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: error != null ? AppColors.error : AppColors.line, width: 1.5),
              ),
              child: Row(children: [
                Expanded(
                  child: Text(value ?? 'Select',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppText.body(14.5, color: value == null ? AppColors.muted : AppColors.ink, height: 1.2)),
                ),
                const Icon(Icons.keyboard_arrow_down_rounded, size: 20, color: AppColors.ink3),
              ]),
            ),
          ),
          if (error != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(error, style: AppText.body(12, color: AppColors.error, height: 1.3))),
        ]);

    return BookingScaffold(
      step: 2,
      title: 'Add new address',
      showProgress: false,
      body: ListView(padding: const EdgeInsets.fromLTRB(20, 8, 20, 24), children: [
        const FieldLabel('Full address', top: 14),
        FpField(controller: _address, hint: 'House / flat, building, area', maxLines: 3, minLines: 2, error: _err['address']),
        const FieldLabel('Landmark / street', hint: 'Optional', top: 14),
        FpField(controller: _street, hint: 'e.g. Near City Mall'),
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: select('State', _state?.name, _err['state'], () async {
              final list = states.valueOrNull;
              if (list == null) return;
              final s = await _pick('Select state', list);
              if (s != null) setState(() { _state = s; _city = null; _err['state'] = null; });
            }),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: select('City', _city?.name, _err['city'], () async {
              final list = cities?.valueOrNull;
              if (list == null) return showToast(context, 'Select the state first');
              if (list.isEmpty) return showToast(context, 'No cities listed for this state yet');
              final c = await _pick('Select city', list);
              if (c != null) setState(() { _city = c; _err['city'] = null; });
            }),
          ),
        ]),
        const FieldLabel('Pincode', top: 14),
        FpField(controller: _pin, hint: '6-digit pincode', keyboardType: TextInputType.number, digitsOnly: true, maxLength: 6, error: _err['pin']),
        if (loggedIn)
          Container(
            margin: const EdgeInsets.only(top: 16),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.line)),
            child: Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Set as default address', style: AppText.body(13.5, weight: FontWeight.w600, color: AppColors.ink, height: 1.3)),
                  Text('Used first next time', style: AppText.body(11.5, color: AppColors.muted, height: 1.3)),
                ]),
              ),
              Switch(value: _default, activeTrackColor: AppColors.primary, onChanged: (v) => setState(() => _default = v)),
            ]),
          ),
      ]),
      footer: BookingSummaryFooter(button: FpButton(label: 'Save address', icon: Icons.check_rounded, loading: _saving, onPressed: _save)),
    );
  }
}

class _PickerSheet extends StatefulWidget {
  const _PickerSheet({required this.title, required this.items});
  final String title;
  final List<NamedItem> items;

  @override
  State<_PickerSheet> createState() => _PickerSheetState();
}

class _PickerSheetState extends State<_PickerSheet> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final shown = widget.items.where((i) => i.name.toLowerCase().contains(_q)).toList();
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * .7,
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.viewInsetsOf(context).bottom),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(widget.title, style: AppText.head(18)),
          const SizedBox(height: 12),
          TextField(
            autofocus: false,
            onChanged: (v) => setState(() => _q = v.trim().toLowerCase()),
            decoration: const InputDecoration(hintText: 'Search', prefixIcon: Icon(Icons.search_rounded)),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              itemCount: shown.length,
              itemBuilder: (_, i) => ListTile(
                title: Text(shown[i].name, style: AppText.body(14.5, color: AppColors.ink)),
                onTap: () => Navigator.pop(context, shown[i]),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}
