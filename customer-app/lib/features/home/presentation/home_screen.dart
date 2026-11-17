import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../../core/session/session_controller.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../router/app_router.dart';
import '../../../shared/models/product.dart';
import '../../../shared/widgets/net_image.dart';
import '../../../shared/widgets/ui.dart';
import '../data/home_repository.dart';

/// Home v2 — mirrors design-html/01-home-v2.html (generator _generators/gen_home_v2.py).
/// Change both together.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref
      ..invalidate(homeProductsProvider(''))
      ..invalidate(homeProductsProvider('refurbished'));
    await ref.read(homeProductsProvider('').future).catchError((_) => <Product>[]);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => _refresh(ref),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.only(bottom: 28),
            children: const [
              _TopBar(),
              _SearchBar(),
              _HelpGrid(),
              _ProductSection(type: 'new', title: 'New products', subtitle: 'Fresh arrivals'),
              _TrustStrip(),
              _BuyRentSell(),
              _HowItWorks(),
              _ProductSection(type: 'refurbished', title: 'Certified refurbished', subtitle: 'Quality tested · with warranty'),
              _BrandsWeRepair(),
              _ExpertBar(),
            ],
          ),
        ),
      ),
    );
  }
}

const _gutter = EdgeInsets.symmetric(horizontal: 20);

/// `.top` — location (default saved address) + bell + cart.
class _TopBar extends ConsumerWidget {
  const _TopBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(sessionProvider);
    final loggedIn = (user?.token ?? '').isNotEmpty;
    final list = (user?.raw['customer_addresses'] as List?)?.whereType<Map>().toList() ?? const [];
    final addr = list.where((a) => '${a['is_default']}' == '1').firstOrNull ?? list.firstOrNull;
    final title = !loggedIn ? 'Set location' : '${addr?['city_name'] ?? ''}'.trim().isNotEmpty ? '${addr!['city_name']}' : 'Your address';
    final sub = !loggedIn ? 'Log in to save your address' : '${addr?['address'] ?? 'Add an address for faster booking'}';

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 0),
      child: Row(children: [
        Expanded(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => context.push(loggedIn ? Routes.account : Routes.login),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.location_on_outlined, size: 18, color: AppColors.primary),
                const SizedBox(width: 4),
                Flexible(child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.head(17))),
                const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: AppColors.ink),
              ]),
              Padding(
                padding: const EdgeInsets.only(left: 22, top: 2),
                child: Text(sub, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppText.body(12.5, color: AppColors.ink3, height: 1.3)),
              ),
            ]),
          ),
        ),
        const SizedBox(width: 10),
        RoundIconButton(icon: Icons.notifications_none_rounded, badge: loggedIn, tooltip: 'Notifications', onTap: () => context.push(Routes.notifications)),
        const SizedBox(width: 10),
        RoundIconButton(icon: Icons.shopping_cart_outlined, tooltip: 'Cart', onTap: () => context.push(loggedIn ? Routes.cart : Routes.login)),
      ]),
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar();

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
        child: Material(
          color: AppColors.bg2,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: () => context.push(Routes.searchProduct),
            child: SizedBox(
              height: 48,
              child: Row(children: [
                const SizedBox(width: 14),
                const Icon(Icons.search_rounded, size: 19, color: AppColors.ink3),
                const SizedBox(width: 10),
                Expanded(child: Text('Search “laptop repair”', style: AppText.body(14, color: AppColors.muted, height: 1.2))),
                const Icon(Icons.mic_none_rounded, size: 19, color: AppColors.ink3),
                const SizedBox(width: 14),
              ]),
            ),
          ),
        ),
      );
}

/// `.help` — "What do you need help with?" 4-column photo grid (website homepage .hsv section).
class _HelpGrid extends StatelessWidget {
  const _HelpGrid();

  // (image in assets/images/help, label, route) — same list and order as HELP in gen_home_v2.py.
  static final _items = [
    ('repair', 'Book a Repair', Routes.bookARepair),
    ('refurbished', 'Refurbished', Uri(path: Routes.productList, queryParameters: {'type': 'refurbished', 'title': 'Refurbished'}).toString()),
    ('health', 'Device Health', Routes.deviceHealth),
    ('amc', 'AMC & Inventory', Routes.amc),
    ('ewaste', 'E-Waste Recycling', Routes.ewaste),
    ('support', 'Technical Support', Routes.technicalSupport),
    ('warranty', 'Check Your Warranty', Routes.warranty),
    ('it', 'IT Services', Routes.amc),
    ('centers', 'Find Service Centers', Routes.serviceCenter),
    ('rental', 'Rental', Routes.rentalList),
    ('openbox', 'Open Box Deals', Routes.openBox),
    ('newproduct', 'New Product', Uri(path: Routes.productList, queryParameters: {'type': 'new', 'title': 'New Product'}).toString()),
  ];

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.fromLTRB(20, 18, 20, 0),
        padding: const EdgeInsets.fromLTRB(14, 16, 14, 18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFF6E6D8)),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Colors.white, Color(0xFFFFF9F4), AppColors.primarySoft],
            stops: [0, .55, 1],
          ),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('What do you need help with?', style: AppText.head(16, height: 1.3)),
          const SizedBox(height: 14),
          LayoutBuilder(builder: (_, c) {
            final w = (c.maxWidth - 30) / 4;
            return Wrap(spacing: 10, runSpacing: 14, children: [
              for (final it in _items)
                GestureDetector(
                  onTap: () => context.push(it.$3),
                  child: SizedBox(
                    width: w,
                    child: Column(children: [
                      Container(
                        width: w,
                        height: w,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: Colors.white, width: 3),
                          boxShadow: const [BoxShadow(color: Color(0x1A0B1220), blurRadius: 12, offset: Offset(0, 4))],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(15),
                          child: Image.asset('assets/images/help/${it.$1}.jpg', fit: BoxFit.cover, cacheWidth: 240),
                        ),
                      ),
                      const SizedBox(height: 7),
                      Text(it.$2, textAlign: TextAlign.center, style: AppText.body(11.5, weight: FontWeight.w600, color: AppColors.ink, height: 1.22)),
                    ]),
                  ),
                ),
            ]);
          }),
        ]),
      );
}

class _SectionHead extends StatelessWidget {
  const _SectionHead(this.title, {this.subtitle, this.onAll, this.allLabel = 'See all'});
  final String title;
  final String? subtitle;
  final VoidCallback? onAll;
  final String allLabel;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 28, 20, 14),
        child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: AppText.head(18, height: 1.3)),
              if (subtitle != null) Text(subtitle!, style: AppText.body(12.5, color: AppColors.ink3, height: 1.4)),
            ]),
          ),
          if (onAll != null)
            GestureDetector(onTap: onAll, child: Text(allLabel, style: AppText.body(13, weight: FontWeight.w600, color: AppColors.primary))),
        ]),
      );
}

/// "How a repair works" — 3 steps + Book a repair (same copy as HOW in gen_home_v2.py).
class _HowItWorks extends StatelessWidget {
  const _HowItWorks();

  static const _steps = [
    ('Book in a minute', 'Pick your device, brand and problem'),
    ('Engineer visits', 'In the 2-hour slot you choose'),
    ('Pay after the visit', 'Cash, once your device is checked'),
  ];

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const _SectionHead('How a repair works', subtitle: 'Simple, at your doorstep'),
        Container(
          margin: _gutter,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.bg2, borderRadius: BorderRadius.circular(18)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            for (var i = 0; i < _steps.length; i++)
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Column(children: [
                  Container(
                    width: 28,
                    height: 28,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                    child: Text('${i + 1}', style: AppText.head(13, color: Colors.white)),
                  ),
                  if (i < _steps.length - 1) Container(width: 2, height: 22, color: const Color(0xFFFCD9BD)),
                ]),
                const SizedBox(width: 12),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 3, bottom: 12),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(_steps[i].$1, style: AppText.body(14, weight: FontWeight.w700, color: AppColors.ink, height: 1.3)),
                      const SizedBox(height: 2),
                      Text(_steps[i].$2, style: AppText.body(12, color: AppColors.ink3, height: 1.3)),
                    ]),
                  ),
                ),
              ]),
            const SizedBox(height: 6),
            Material(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => context.push(Routes.bookARepair),
                child: SizedBox(
                  height: 44,
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('Book a repair', style: AppText.body(14, weight: FontWeight.w600, color: Colors.white, height: 1.2)),
                    const SizedBox(width: 6),
                    const Icon(Icons.arrow_forward_rounded, size: 15, color: Colors.white),
                  ]),
                ),
              ),
            ),
          ]),
        ),
      ]);
}

/// "Brands we repair" — website logos; tap to start a booking (same list as BRANDS in gen_home_v2.py).
class _BrandsWeRepair extends StatelessWidget {
  const _BrandsWeRepair();

  static const _brands = ['dell', 'hp', 'lenovo', 'apple', 'asus', 'acer', 'epson', 'brother'];

  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        _SectionHead('Brands we repair', subtitle: 'And many more', allLabel: 'Book now', onAll: () => context.push(Routes.bookARepair)),
        Padding(
          padding: _gutter,
          child: LayoutBuilder(builder: (_, c) {
            final w = (c.maxWidth - 30) / 4;
            return Wrap(spacing: 10, runSpacing: 10, children: [
              for (final b in _brands)
                GestureDetector(
                  onTap: () => context.push(Routes.bookARepair),
                  child: Container(
                    width: w,
                    height: 56,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.line)),
                    child: SizedBox(width: 52, height: 26, child: SvgPicture.asset('assets/images/brands/$b.svg', fit: BoxFit.contain)),
                  ),
                ),
            ]);
          }),
        ),
      ]);
}

class _TrustStrip extends StatelessWidget {
  const _TrustStrip();

  @override
  Widget build(BuildContext context) {
    Widget item(Widget v, String l) => Expanded(
          child: Column(children: [v, const SizedBox(height: 6), Text(l, style: AppText.body(11, color: AppColors.ink3, height: 1.2))]),
        );
    Widget sep() => Container(width: 1, height: 34, color: AppColors.line);
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.line)),
      child: Row(children: [
        item(Row(mainAxisSize: MainAxisSize.min, children: [
          Text('4.8', style: AppText.head(15)),
          const SizedBox(width: 4),
          const Icon(Icons.star_rounded, size: 15, color: AppColors.primary),
        ]), 'Customer rating'),
        sep(),
        item(Text('90 days', style: AppText.head(15)), 'Repair warranty'),
        sep(),
        item(Text('50k+', style: AppText.head(15)), 'Devices fixed'),
      ]),
    );
  }
}

/// "Buy, rent or sell" — navy refurbished card + Rent / Sell e-waste photo cards.
class _BuyRentSell extends ConsumerWidget {
  const _BuyRentSell();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final refurb = ref.watch(homeProductsProvider('refurbished')).valueOrNull ?? const <Product>[];
    final maxOff = refurb.isEmpty ? 0 : refurb.map((p) => p.discountPercent).reduce((a, b) => a > b ? a : b).round();

    Widget photoCard(String img, String tag, Color tagColor, String title, String sub, VoidCallback onTap) => Expanded(
          child: Material(
            color: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18), side: const BorderSide(color: AppColors.line)),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onTap,
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                SizedBox(
                  height: 96,
                  child: Stack(fit: StackFit.expand, children: [
                    Image.asset('assets/images/$img', fit: BoxFit.cover, cacheWidth: 400),
                    Positioned(
                      left: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: tagColor, borderRadius: BorderRadius.circular(6)),
                        child: Text(tag, style: AppText.body(10.5, weight: FontWeight.w700, color: Colors.white, height: 1.3)),
                      ),
                    ),
                  ]),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 10, 12),
                  child: Row(children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(title, style: AppText.head(14.5, height: 1.3)),
                        Text(sub, style: AppText.body(11.5, color: AppColors.ink3, height: 1.4)),
                      ]),
                    ),
                    Container(
                      width: 30,
                      height: 30,
                      decoration: const BoxDecoration(color: AppColors.bg2, shape: BoxShape.circle),
                      child: const Icon(Icons.chevron_right_rounded, size: 18, color: AppColors.ink),
                    ),
                  ]),
                ),
              ]),
            ),
          ),
        );

    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      const _SectionHead('Buy, rent or sell'),
      Padding(
        padding: _gutter,
        child: GestureDetector(
          onTap: () => context.push(Uri(path: Routes.productList, queryParameters: {'type': 'refurbished', 'title': 'Refurbished'}).toString()),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Container(
              height: 184,
              decoration: const BoxDecoration(gradient: AppColors.gradDark),
              child: Stack(children: [
                Positioned(
                  right: -40,
                  top: -30,
                  child: Container(
                    width: 220,
                    height: 220,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: .22), blurRadius: 80, spreadRadius: 10)],
                    ),
                  ),
                ),
                Positioned(right: -10, bottom: 26, child: Image.asset('assets/images/laptop-cutout.png', width: 172, height: 118, fit: BoxFit.contain)),
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 18, 0, 0),
                  child: SizedBox(
                    width: 190,
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: .16), borderRadius: BorderRadius.circular(20)),
                        child: Text('Certified refurbished', style: AppText.body(11, weight: FontWeight.w600, color: AppColors.accent2, height: 1.2)),
                      ),
                      const SizedBox(height: 10),
                      Text.rich(
                        TextSpan(children: maxOff > 0
                            ? [const TextSpan(text: 'Up to '), TextSpan(text: '$maxOff% off', style: const TextStyle(color: AppColors.primary))]
                            : [const TextSpan(text: 'Big savings')]),
                        style: AppText.head(24, color: Colors.white, height: 1.2),
                      ),
                      const SizedBox(height: 4),
                      Text('Laptops & desktops, quality\ntested with warranty', style: AppText.body(12, color: AppColors.muted, height: 1.4)),
                      const SizedBox(height: 12),
                      Container(
                        height: 34,
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: const ShapeDecoration(color: AppColors.primary, shape: StadiumBorder()),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Text('Shop now', style: AppText.body(13, weight: FontWeight.w600, color: Colors.white, height: 1.2)),
                          const SizedBox(width: 6),
                          const Icon(Icons.arrow_forward_rounded, size: 14, color: Colors.white),
                        ]),
                      ),
                    ]),
                  ),
                ),
              ]),
            ),
          ),
        ),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          photoCard('rent-laptop.jpg', 'RENT', AppColors.blue, 'Rent a device', 'Monthly plans', () => context.push(Routes.rentalList)),
          const SizedBox(width: 12),
          photoCard('photo-ewaste.jpg', 'SELL', AppColors.green, 'Sell e-waste', 'Free pickup', () => context.push(Routes.ewaste)),
        ]),
      ),
    ]);
  }
}

/// Product rail (deals / refurbished) with minimal cards.
class _ProductSection extends ConsumerWidget {
  const _ProductSection({required this.type, required this.title, this.subtitle});
  final String type;
  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(homeProductsProvider(type));
    final list = items.valueOrNull ?? const <Product>[];
    if (items.hasError || (items.hasValue && list.isEmpty)) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      _SectionHead(
        title,
        subtitle: subtitle,
        onAll: () => context.push(Uri(path: Routes.productList, queryParameters: {'type': type, 'title': title}).toString()),
      ),
      SizedBox(
        height: 230,
        child: items.isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2.4))
            : ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: _gutter,
                itemCount: list.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (_, i) => _MiniProductCard(
                  p: list[i],
                  onTap: () => context.push(Uri(path: Routes.productDetail, queryParameters: {'id': '${list[i].id}', 'slug': list[i].slug}).toString()),
                ),
              ),
      ),
    ]);
  }
}

class _MiniProductCard extends StatelessWidget {
  const _MiniProductCard({required this.p, required this.onTap});
  final Product p;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final name = p.name.replaceAll(RegExp(r'\(\s*refurbished\s*\)', caseSensitive: false), '').trim();
    final off = p.costPrice > p.sellingPrice ? ((1 - p.sellingPrice / p.costPrice) * 100).round() : 0;
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 148,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 148,
            height: 148,
            decoration: BoxDecoration(color: AppColors.bg2, borderRadius: BorderRadius.circular(16)),
            child: Stack(children: [
              Center(child: NetImage(p.imageUrl, width: 108, height: 108, fit: BoxFit.contain, background: Colors.transparent)),
              if (off > 0)
                Positioned(
                  left: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(6)),
                    child: Text('$off% off', style: AppText.body(10.5, weight: FontWeight.w700, color: AppColors.green, height: 1.3)),
                  ),
                ),
            ]),
          ),
          const SizedBox(height: 10),
          Text(p.brandName, style: AppText.body(11, weight: FontWeight.w500, color: AppColors.muted, height: 1.2)),
          const SizedBox(height: 2),
          SizedBox(
            height: 34,
            child: Text(name, maxLines: 2, overflow: TextOverflow.ellipsis, style: AppText.body(13, weight: FontWeight.w500, color: AppColors.ink2, height: 1.3)),
          ),
          const SizedBox(height: 6),
          Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
            Text(inr(p.sellingPrice), style: AppText.head(15)),
            if (off > 0) ...[
              const SizedBox(width: 6),
              Flexible(
                child: Text(inr(p.costPrice),
                    overflow: TextOverflow.ellipsis,
                    style: AppText.body(11.5, color: AppColors.muted).copyWith(decoration: TextDecoration.lineThrough)),
              ),
            ],
          ]),
        ]),
      ),
    );
  }
}

/// `.expert` — navy "Talk to an expert" bar.
class _ExpertBar extends StatelessWidget {
  const _ExpertBar();

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
        child: Material(
          color: AppColors.ink,
          borderRadius: BorderRadius.circular(18),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () => context.push(Routes.technicalSupport),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: const BoxDecoration(color: AppColors.navy3, shape: BoxShape.circle),
                  child: const Icon(Icons.headset_mic_outlined, size: 22, color: AppColors.primary),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Talk to an expert', style: AppText.head(15, color: Colors.white)),
                    const SizedBox(height: 3),
                    Text('Fix it on a call · from ₹5/min', style: AppText.body(12, color: AppColors.muted, height: 1.3)),
                  ]),
                ),
                Container(
                  width: 36,
                  height: 36,
                  decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                  child: const Icon(Icons.arrow_forward_rounded, size: 17, color: Colors.white),
                ),
              ]),
            ),
          ),
        ),
      );
}
