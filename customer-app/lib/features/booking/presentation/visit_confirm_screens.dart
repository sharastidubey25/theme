import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/network/api_client.dart';
import '../../../core/session/session_controller.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../router/app_router.dart';
import '../../../shared/widgets/ui.dart';
import '../../auth/data/auth_repository.dart';
import '../data/booking_draft.dart';
import '../data/booking_repository.dart';
import 'booking_ui.dart';

const _wk = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const _mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const _monthLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

DateTime _day(DateTime d) => DateTime(d.year, d.month, d.day);
String fmtDay(DateTime d) => '${_wk[d.weekday - 1]}, ${d.day} ${_mon[d.month - 1]}';

/// RN SelectDateTime.generateTimeSlots: 9 AM – 9 PM in 2-hour windows; today only slots that
/// start after the current hour and before 3 PM. Values are the API strings ("01:00PM - 03:00PM").
List<String> slotsFor(DateTime date, {DateTime? now}) {
  final n = now ?? DateTime.now();
  final today = _day(date) == _day(n);
  String t(int h) => '${(h > 12 ? h - 12 : (h == 0 ? 12 : h)).toString().padLeft(2, '0')}:00${h >= 12 ? 'PM' : 'AM'}';
  return [
    for (var h = 9; h < (today ? 15 : 21); h += 2)
      if (!today || h > n.hour) '${t(h)} - ${t(h + 2)}',
  ];
}

/// "01:00PM - 03:00PM" → "1 – 3 PM"
String prettySlot(String s) {
  final m = RegExp(r'(\d+):\d+(AM|PM) - (\d+):\d+(AM|PM)').firstMatch(s);
  if (m == null) return s;
  final a = int.parse(m[1]!), b = int.parse(m[3]!);
  return m[2] == m[4] ? '$a – $b ${m[4]}' : '$a ${m[2]} – $b ${m[4]}';
}

/// 21 · When should we come?
class RepairSlotScreen extends ConsumerStatefulWidget {
  const RepairSlotScreen({super.key});

  @override
  ConsumerState<RepairSlotScreen> createState() => _RepairSlotScreenState();
}

class _RepairSlotScreenState extends ConsumerState<RepairSlotScreen> {
  late final List<DateTime> _days = List.generate(7, (i) => _day(DateTime.now()).add(Duration(days: i)));
  late DateTime _date = ref.read(bookingDraftProvider).date ?? (slotsFor(_days.first).isEmpty ? _days[1] : _days.first);
  late String? _slot = ref.read(bookingDraftProvider).slot;
  late bool _someoneElse = ref.read(bookingDraftProvider).altMobile.isNotEmpty;
  late final _altName = TextEditingController(text: ref.read(bookingDraftProvider).altName);
  late final _altMobile = TextEditingController(text: ref.read(bookingDraftProvider).altMobile);
  String? _altErr;

  @override
  void dispose() {
    _altName.dispose();
    _altMobile.dispose();
    super.dispose();
  }

  Future<void> _calendar() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: _days.first,
      lastDate: _days.first.add(const Duration(days: 60)),
    );
    if (d != null) setState(() { _date = d; _slot = null; });
  }

  void _next() {
    if (_someoneElse && Validators.mobile(_altMobile.text) != null) return setState(() => _altErr = Validators.mobile(_altMobile.text));
    ref.read(bookingDraftProvider.notifier).update((d) => d.copyWith(
          date: _date,
          slot: _slot,
          altName: _someoneElse ? _altName.text.trim() : '',
          altMobile: _someoneElse ? _altMobile.text.trim() : '',
        ));
    context.push(Routes.repairReview);
  }

  @override
  Widget build(BuildContext context) {
    final slots = slotsFor(_date);
    final strip = _days.contains(_date) ? _days : [..._days.take(6), _date];
    return BookingScaffold(
      step: 2,
      body: ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 24), children: [
        const BookingTitle('When should we come?'),
        Padding(
          padding: const EdgeInsets.only(top: 18, bottom: 8),
          child: Row(children: [
            Expanded(child: Text('${_monthLong[_date.month - 1]} ${_date.year}', style: AppText.body(13, weight: FontWeight.w600, color: AppColors.ink2))),
            GestureDetector(
              onTap: _calendar,
              child: Row(children: [
                const Icon(Icons.calendar_today_outlined, size: 15, color: AppColors.primary),
                const SizedBox(width: 5),
                Text('Calendar', style: AppText.body(12.5, weight: FontWeight.w600, color: AppColors.primary)),
              ]),
            ),
          ]),
        ),
        LayoutBuilder(builder: (_, c) {
          final w = (c.maxWidth - 6 * 7) / 7;
          return Row(children: [
            for (var i = 0; i < strip.length; i++) ...[
              if (i > 0) const SizedBox(width: 7),
              _DayChip(
                width: w,
                top: _day(strip[i]) == _days.first ? 'Today' : _wk[strip[i].weekday - 1],
                day: '${strip[i].day}',
                on: _day(strip[i]) == _day(_date),
                onTap: () => setState(() { _date = strip[i]; _slot = null; }),
              ),
            ],
          ]);
        }),
        const FieldLabel('Time slot', hint: 'Engineer arrives within the slot', top: 22),
        if (slots.isEmpty)
          Text('No time slot left for today. Please pick another day.', style: AppText.body(13.5, color: AppColors.ink3))
        else
          LayoutBuilder(builder: (_, c) {
            final w = (c.maxWidth - 10) / 2;
            return Wrap(spacing: 10, runSpacing: 10, children: [
              for (final s in slots)
                SizedBox(width: w, child: _SlotChip(label: prettySlot(s), on: _slot == s, onTap: () => setState(() => _slot = s))),
            ]);
          }),
        Container(
          margin: const EdgeInsets.only(top: 20),
          padding: const EdgeInsets.fromLTRB(14, 6, 8, 6),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.line)),
          child: Column(children: [
            Row(children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: AppColors.bg2, borderRadius: BorderRadius.circular(11)),
                child: const Icon(Icons.person_outline_rounded, size: 18, color: AppColors.ink3),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Someone else will be there?', style: AppText.body(13.5, weight: FontWeight.w600, color: AppColors.ink, height: 1.3)),
                  Text('Add their name & mobile', style: AppText.body(11.5, color: AppColors.muted, height: 1.3)),
                ]),
              ),
              Switch(value: _someoneElse, activeTrackColor: AppColors.primary, onChanged: (v) => setState(() => _someoneElse = v)),
            ]),
            if (_someoneElse)
              Padding(
                padding: const EdgeInsets.fromLTRB(0, 8, 6, 10),
                child: Column(children: [
                  FpField(controller: _altName, hint: 'Their name', icon: Icons.person_outline_rounded, textCapitalization: TextCapitalization.words),
                  const SizedBox(height: 10),
                  FpField(
                    controller: _altMobile,
                    hint: '98765 43210',
                    prefix: const PhonePrefix(),
                    keyboardType: TextInputType.phone,
                    digitsOnly: true,
                    maxLength: 10,
                    error: _altErr,
                    onChanged: (_) => setState(() => _altErr = null),
                  ),
                ]),
              ),
          ]),
        ),
      ]),
      footer: BookingSummaryFooter(
        label: fmtDay(_date),
        value: _slot == null ? 'Pick a slot' : prettySlot(_slot!),
        button: FpButton(label: 'Continue', onPressed: _slot == null ? null : _next),
      ),
    );
  }
}

class _DayChip extends StatelessWidget {
  const _DayChip({required this.width, required this.top, required this.day, required this.on, required this.onTap});
  final double width;
  final String top;
  final String day;
  final bool on;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          width: width,
          height: 66,
          decoration: BoxDecoration(
            color: on ? AppColors.primary : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: on ? AppColors.primary : AppColors.line, width: 1.5),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(top, style: AppText.body(11, weight: FontWeight.w500, color: on ? Colors.white : AppColors.ink3, height: 1.2)),
            const SizedBox(height: 4),
            Text(day, style: AppText.head(18, color: on ? Colors.white : AppColors.ink)),
          ]),
        ),
      );
}

class _SlotChip extends StatelessWidget {
  const _SlotChip({required this.label, required this.on, required this.onTap});
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
            height: 50,
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.schedule_rounded, size: 15, color: on ? AppColors.primary : AppColors.ink3),
              const SizedBox(width: 7),
              Text(label, style: AppText.body(13.5, weight: FontWeight.w600, color: on ? AppColors.primary : AppColors.ink2, height: 1.2)),
            ]),
          ),
        ),
      );
}

/// 22 · Review & confirm (+ 23 · Log in to book) → create-service-call → upload photos → 24.
class RepairReviewScreen extends ConsumerStatefulWidget {
  const RepairReviewScreen({super.key});

  @override
  ConsumerState<RepairReviewScreen> createState() => _RepairReviewScreenState();
}

class _RepairReviewScreenState extends ConsumerState<RepairReviewScreen> {
  bool _tnc = true;
  bool _busy = false;

  void _editAt(String route) => Navigator.of(context).popUntil((r) => r.settings.name == route || r.isFirst);

  Future<void> _confirm() async {
    if (!_tnc) return showToast(context, 'Please accept the Terms & Conditions');
    if (!ref.read(isLoggedInProvider)) {
      final ok = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(26))),
        builder: (_) => const _LoginToBookSheet(),
      );
      if (ok != true || !mounted || !ref.read(isLoggedInProvider)) return;
    }
    await _submit();
  }

  Future<void> _submit() async {
    final d = ref.read(bookingDraftProvider);
    final user = ref.read(sessionProvider)?.raw ?? const {};
    final s = d.service!, a = d.address!;
    setState(() => _busy = true);
    try {
      final repo = ref.read(bookingRepositoryProvider);
      final subs = await repo.subServices(s.id);
      final sub = subs.where((x) => x.id == s.subServiceId).firstOrNull;
      final price = sub?.price ?? s.price;
      final cgst = sub?.cgst ?? s.cgst, sgst = sub?.sgst ?? s.sgst;
      final total = double.parse((price * (1 + (cgst + sgst) / 100)).toStringAsFixed(2));
      final date = '${d.date!.year}-${d.date!.month.toString().padLeft(2, '0')}-${d.date!.day.toString().padLeft(2, '0')}';
      final partner = user['partner_id'];
      final hasPartner = partner != null && '$partner' != '0' && '$partner'.isNotEmpty;

      final id = await repo.createServiceCall({
        'customerAccountType': user['customer_account_type'] ?? 'individual',
        'partnerID': partner ?? 0,
        'firmName': user['firm_name'] ?? '',
        'branchID': 0,
        'addressID': a.id,
        'address': a.address,
        'street': a.street,
        'formattedAddress': '',
        'compoundAddress': '',
        'taskTitle': d.title,
        'taskDescription': d.description,
        'lat': '',
        'long': '',
        'countryID': 101,
        'stateID': a.stateId,
        'cityID': a.cityId,
        'totalAmount': total,
        'totalDiscount': 0,
        'pincode': a.pincode,
        'customerCallType': hasPartner ? 'partner_customer' : 'fixpapa_direct',
        'callType': user['amc_status'] == 'active' ? 'amc' : 'normal',
        'amcCallType': '',
        'preferredDate': date,
        'preferredTime': d.slot,
        'alternativeMobile': d.altMobile,
        'alternativePersonName': d.altName,
        'serviceCallItems': [
          {
            'serviceID': s.id,
            'subServiceID': s.subServiceId,
            'productCategoryID': d.category!.id,
            'brandID': d.brand?.id ?? 0,
            'description': sub?.name ?? s.subServiceName,
            'preferredDate': date,
            'preferredTime': d.slot,
            'carbonCredit': sub?.carbonCredit ?? 0,
            'quantity': 1,
            'cgst': cgst,
            'sgst': sgst,
            'basicServiceCharges': price,
            'totalAmount': total,
            'paymentMethod': 'cash',
          }
        ],
      });
      try {
        await repo.uploadImages(id, d.images);
      } on ApiException catch (e) {
        if (mounted) showToast(context, 'Booked, but photos could not be uploaded: ${e.message}');
      }
      if (!mounted) return;
      final summary = '${d.category!.name}${d.brandSkipped || d.brand == null || d.brand!.isOther ? '' : ' · ${d.brand!.name}'} · ${s.name}';
      final when = '${fmtDay(d.date!)} · ${prettySlot(d.slot!)}';
      ref.read(bookingDraftProvider.notifier).start();
      context.go(Uri(path: Routes.repairDone, queryParameters: {'id': '$id', 'summary': summary, 'when': when}).toString());
    } on ApiException catch (e) {
      if (mounted) showToast(context, e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = ref.watch(bookingDraftProvider);
    if (d.service == null || d.address == null || d.date == null || d.slot == null) {
      return const BookingScaffold(step: 3, body: SizedBox());
    }
    final s = d.service!;
    final gst = s.price * (s.cgst + s.sgst) / 100;
    final total = s.price + gst;
    String money(num v) => '₹${v.toStringAsFixed(2).replaceAllMapped(RegExp(r'(\d)(?=(\d{2})+\d\.)'), (m) => '${m[1]},')}';
    final device = d.brandSkipped || d.brand == null ? d.category!.name : '${d.category!.name} · ${d.brand!.name}';
    final issue = [d.title, if (d.images.isNotEmpty) '${d.images.length} photo${d.images.length > 1 ? 's' : ''}'].join(' · ');

    final rows = [
      (Icons.laptop_mac_rounded, 'Device', device, Routes.repairProblem),
      (Icons.build_outlined, 'Problem', s.name, Routes.repairProblem),
      (Icons.description_outlined, 'Issue', issue, Routes.repairIssue),
      (Icons.location_on_outlined, 'Address', [d.address!.address, d.address!.place].where((x) => x.isNotEmpty).join(', '), Routes.repairAddress),
      (Icons.calendar_today_outlined, 'Visit', '${fmtDay(d.date!)} · ${prettySlot(d.slot!)}', Routes.repairSlot),
    ];

    return BookingScaffold(
      step: 3,
      body: ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 24), children: [
        const BookingTitle('Review & confirm'),
        Container(
          margin: const EdgeInsets.only(top: 14),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.line)),
          child: Column(children: [
            for (var i = 0; i < rows.length; i++)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(border: i == 0 ? null : const Border(top: BorderSide(color: AppColors.line))),
                child: Row(children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(11)),
                    child: Icon(rows[i].$1, size: 17, color: AppColors.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(rows[i].$2, style: AppText.body(11.5, weight: FontWeight.w500, color: AppColors.muted, height: 1.3)),
                      const SizedBox(height: 2),
                      Text(rows[i].$3, style: AppText.body(13.5, weight: FontWeight.w600, color: AppColors.ink, height: 1.35)),
                    ]),
                  ),
                  GestureDetector(
                    onTap: () => _editAt(rows[i].$4),
                    child: Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: Text('Edit', style: AppText.body(12.5, weight: FontWeight.w600, color: AppColors.primary)),
                    ),
                  ),
                ]),
              ),
          ]),
        ),
        Container(
          margin: const EdgeInsets.only(top: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: AppColors.bg2, borderRadius: BorderRadius.circular(18)),
          child: Column(children: [
            _billRow('${s.subServiceName.isEmpty ? 'Diagnosis' : s.subServiceName} charge', money(s.price)),
            const SizedBox(height: 10),
            _billRow('GST (CGST ${s.cgst}% + SGST ${s.sgst}%)', money(gst)),
            const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider(height: 1, color: AppColors.disabled)),
            Row(children: [
              Expanded(child: Text('Total', style: AppText.head(16))),
              Text(money(total), style: AppText.head(16)),
            ]),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Row(children: [
            const Icon(Icons.account_balance_wallet_outlined, size: 16, color: AppColors.green),
            const SizedBox(width: 8),
            Text('Pay by cash after the visit', style: AppText.body(12.5, weight: FontWeight.w600, color: AppColors.green)),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 14),
          child: Row(children: [
            GestureDetector(
              onTap: () => setState(() => _tnc = !_tnc),
              child: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: _tnc ? AppColors.primary : Colors.white,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: _tnc ? AppColors.primary : AppColors.borderStrong, width: 1.5),
                ),
                child: _tnc ? const Icon(Icons.check_rounded, size: 13, color: Colors.white) : null,
              ),
            ),
            const SizedBox(width: 10),
            Text('I accept the ', style: AppText.body(12.5, color: AppColors.ink3)),
            GestureDetector(
              onTap: () => launchUrl(Uri.parse('https://fixpapa.com/terms-and-conditions')),
              child: Text('Terms & Conditions', style: AppText.body(12.5, weight: FontWeight.w700, color: AppColors.primary)),
            ),
          ]),
        ),
      ]),
      footer: BookingSummaryFooter(
        label: 'Total',
        value: money(total),
        button: FpButton(label: 'Confirm booking', icon: Icons.check_rounded, loading: _busy, onPressed: _confirm),
      ),
    );
  }

  Widget _billRow(String k, String v) => Row(children: [
        Expanded(child: Text(k, style: AppText.body(13.5, color: AppColors.ink3, height: 1.3))),
        Text(v, style: AppText.body(13.5, weight: FontWeight.w600, color: AppColors.ink, height: 1.3)),
      ]);
}

/// 23 · Log in to book — mobile → OTP screen (returns here), or create an account.
class _LoginToBookSheet extends ConsumerStatefulWidget {
  const _LoginToBookSheet();

  @override
  ConsumerState<_LoginToBookSheet> createState() => _LoginToBookSheetState();
}

class _LoginToBookSheetState extends ConsumerState<_LoginToBookSheet> {
  final _mobile = TextEditingController();
  String? _err;
  bool _busy = false;

  @override
  void dispose() {
    _mobile.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final e = Validators.mobile(_mobile.text);
    if (e != null) return setState(() => _err = e);
    setState(() => _busy = true);
    try {
      final m = _mobile.text.trim();
      await ref.read(authRepositoryProvider).sendOtp(m);
      if (!mounted) return;
      final ok = await context.push<bool>(Uri(path: Routes.otp, queryParameters: {'mobile': m, 'next': 'back'}).toString());
      if (mounted) Navigator.pop(context, ok == true);
    } on ApiException catch (x) {
      if (mounted) setState(() => _err = x.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.fromLTRB(20, 10, 20, 20 + MediaQuery.viewInsetsOf(context).bottom + MediaQuery.paddingOf(context).bottom),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.borderStrong, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 18),
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(color: AppColors.primarySoft, borderRadius: BorderRadius.circular(16)),
            child: const Icon(Icons.smartphone_rounded, size: 24, color: AppColors.primary),
          ),
          const SizedBox(height: 14),
          Text('Log in to book', style: AppText.head(20)),
          const SizedBox(height: 4),
          Text('One-time code by SMS. No password needed.', style: AppText.body(13.5, color: AppColors.ink3)),
          const FieldLabel('Mobile number', top: 18),
          FpField(
            controller: _mobile,
            hint: '98765 43210',
            prefix: const PhonePrefix(),
            keyboardType: TextInputType.phone,
            digitsOnly: true,
            maxLength: 10,
            autofocus: true,
            error: _err,
            onChanged: (_) => setState(() => _err = null),
            onSubmitted: (_) => _send(),
          ),
          const SizedBox(height: 18),
          FpButton(label: 'Get OTP', loading: _busy, onPressed: _send),
          const SizedBox(height: 16),
          Center(
            child: GestureDetector(
              onTap: () async {
                final ok = await context.push<bool>(Uri(path: Routes.register, queryParameters: {'next': 'back'}).toString());
                if (context.mounted) Navigator.pop(context, ok == true);
              },
              child: Text.rich(TextSpan(children: [
                TextSpan(text: 'New to FixPapa? ', style: AppText.body(14, color: AppColors.ink3)),
                TextSpan(text: 'Create account', style: AppText.body(14, weight: FontWeight.w700, color: AppColors.primary)),
              ])),
            ),
          ),
        ]),
      );
}

/// 24 · Request submitted!
class RepairDoneScreen extends StatelessWidget {
  const RepairDoneScreen({super.key, required this.id, required this.summary, required this.when});
  final String id;
  final String summary;
  final String when;

  @override
  Widget build(BuildContext context) {
    final steps = [('Request received', 'Just now', true), ('Engineer assigned', "We'll call you to confirm", false), ('Engineer visits', when, false)];
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(children: [
          Expanded(
            child: ListView(padding: const EdgeInsets.fromLTRB(20, 30, 20, 20), children: [
              Center(
                child: Container(
                  width: 150,
                  height: 150,
                  decoration: const BoxDecoration(color: Color(0xFFF0FDF4), shape: BoxShape.circle),
                  alignment: Alignment.center,
                  child: Container(
                    width: 110,
                    height: 110,
                    decoration: const BoxDecoration(color: AppColors.greenSoft, shape: BoxShape.circle),
                    alignment: Alignment.center,
                    child: Container(
                      width: 74,
                      height: 74,
                      decoration: const BoxDecoration(color: AppColors.green, shape: BoxShape.circle),
                      child: const Icon(Icons.check_rounded, size: 40, color: Colors.white),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text('Request submitted!', textAlign: TextAlign.center, style: AppText.head(26)),
              const SizedBox(height: 6),
              Text('$summary. Track it any time from Bookings.', textAlign: TextAlign.center, style: AppText.body(13.5, color: AppColors.ink3)),
              const SizedBox(height: 18),
              if (id.isNotEmpty && id != '0')
                Center(
                  child: Container(
                    height: 40,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(color: AppColors.bg2, borderRadius: BorderRadius.circular(20)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Text('Request ID ', style: AppText.body(12.5, color: AppColors.ink3)),
                      Text('#$id', style: AppText.mono(12.5, weight: FontWeight.w600, color: AppColors.ink)),
                    ]),
                  ),
                ),
              Container(
                margin: const EdgeInsets.only(top: 24),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.line)),
                child: Column(children: [
                  for (var i = 0; i < steps.length; i++)
                    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Column(children: [
                        Container(
                          width: 22,
                          height: 22,
                          decoration: BoxDecoration(
                            color: steps[i].$3 ? AppColors.green : Colors.white,
                            shape: BoxShape.circle,
                            border: steps[i].$3 ? null : Border.all(color: AppColors.borderStrong, width: 2),
                          ),
                          child: steps[i].$3 ? const Icon(Icons.check_rounded, size: 13, color: Colors.white) : null,
                        ),
                        if (i < steps.length - 1) Container(width: 2, height: 30, color: AppColors.line),
                      ]),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(steps[i].$1, style: AppText.body(14, weight: FontWeight.w600, color: AppColors.ink, height: 1.3)),
                            Text(steps[i].$2, style: AppText.body(12, color: AppColors.ink3, height: 1.4)),
                          ]),
                        ),
                      ),
                    ]),
                ]),
              ),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
            child: Column(children: [
              FpButton(label: 'View my bookings', onPressed: () => context.go(Routes.bookings)),
              const SizedBox(height: 10),
              FpButton(label: 'Back to home', ghost: true, onPressed: () => context.go(Routes.home)),
            ]),
          ),
        ]),
      ),
    );
  }
}
