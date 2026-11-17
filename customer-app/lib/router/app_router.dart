import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/otp_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/booking/presentation/device_screens.dart';
import '../features/booking/presentation/issue_address_screens.dart';
import '../features/booking/presentation/visit_confirm_screens.dart';
import '../features/home/presentation/home_screen.dart';
import '../shared/widgets/main_shell.dart';
import '../shared/widgets/pending_screen.dart';

/// Screens not yet redesigned resolve to [PendingScreen].
abstract final class Routes {
  // Bottom tabs (design-html/01-home-v2.html nav: Home · Bookings · Shop · Account)
  static const home = '/';
  static const bookings = '/bookings';
  static const shop = '/shop';
  static const account = '/account';

  // Book a Repair v2 (design-html/05-book-repair-v2.html). Page names = paths, so
  // Review's "Edit" can pop back to a step with popUntil(settings.name).
  static const bookARepair = '/repair';
  static const repairBrand = '/repair/brand';
  static const repairProblem = '/repair/problem';
  static const repairIssue = '/repair/issue';
  static const repairAddress = '/repair/address';
  static const repairAddAddress = '/repair/address/new';
  static const repairSlot = '/repair/slot';
  static const repairReview = '/repair/review';
  static const repairDone = '/repair/done';

  // Pushed screens
  static const menu = '/menu';
  static const login = '/login';
  static const register = '/register';
  static const otp = '/otp';
  static const cart = '/cart';
  static const notifications = '/notifications';
  static const searchProduct = '/search';
  static const productList = '/products';
  static const productDetail = '/product';
  static const ewaste = '/ewaste';
  static const amc = '/amc';
  static const deviceHealth = '/device-health';
  static const warranty = '/warranty';
  static const openBox = '/open-box';
  static const bookAnInstallation = '/book-an-installation';
  static const technicalSupport = '/technical-support';
  static const rentalList = '/rental';
  static const serviceCenter = '/service-centers';
}

final _rootKey = GlobalKey<NavigatorState>();

GoRoute _pending(String path, String title) => GoRoute(
      path: path,
      parentNavigatorKey: _rootKey,
      builder: (_, s) => PendingScreen(title: title, params: s.uri.queryParameters),
    );

/// Full-screen route whose page is named after its path.
GoRoute _page(String path, Widget Function(GoRouterState s) build) => GoRoute(
      path: path,
      parentNavigatorKey: _rootKey,
      pageBuilder: (_, s) => MaterialPage(key: s.pageKey, name: path, child: build(s)),
    );

final appRouter = GoRouter(
  navigatorKey: _rootKey,
  initialLocation: Routes.home,
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (_, _, shell) => MainShell(shell: shell),
      branches: [
        StatefulShellBranch(routes: [GoRoute(path: Routes.home, builder: (_, _) => const HomeScreen())]),
        StatefulShellBranch(routes: [
          GoRoute(path: Routes.bookings, builder: (_, _) => const PendingScreen(title: 'My bookings', inShell: true)),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: Routes.shop, builder: (_, _) => const PendingScreen(title: 'Shop', inShell: true)),
        ]),
        StatefulShellBranch(routes: [
          GoRoute(path: Routes.account, builder: (_, _) => const PendingScreen(title: 'Account', inShell: true)),
        ]),
      ],
    ),
    _page(Routes.bookARepair, (_) => const RepairCategoryScreen()),
    _page(Routes.repairBrand, (s) => RepairBrandScreen(
          categoryId: int.tryParse(s.uri.queryParameters['cat'] ?? ''),
          fromList: s.uri.queryParameters['from'] == 'list',
        )),
    _page(Routes.repairProblem, (_) => const RepairProblemScreen()),
    _page(Routes.repairIssue, (_) => const RepairIssueScreen()),
    _page(Routes.repairAddress, (_) => const RepairAddressScreen()),
    _page(Routes.repairAddAddress, (_) => const RepairAddAddressScreen()),
    _page(Routes.repairSlot, (_) => const RepairSlotScreen()),
    _page(Routes.repairReview, (_) => const RepairReviewScreen()),
    _page(Routes.repairDone, (s) => RepairDoneScreen(
          id: s.uri.queryParameters['id'] ?? '',
          summary: s.uri.queryParameters['summary'] ?? '',
          when: s.uri.queryParameters['when'] ?? '',
        )),
    _pending(Routes.menu, 'Menu'),
    GoRoute(
      path: Routes.login,
      parentNavigatorKey: _rootKey,
      builder: (_, s) => LoginScreen(returnBack: s.uri.queryParameters['next'] == 'back'),
    ),
    GoRoute(
      path: Routes.register,
      parentNavigatorKey: _rootKey,
      builder: (_, s) => RegisterScreen(returnBack: s.uri.queryParameters['next'] == 'back'),
    ),
    GoRoute(
      path: Routes.otp,
      parentNavigatorKey: _rootKey,
      builder: (_, s) => OtpScreen(mobile: s.uri.queryParameters['mobile'] ?? '', returnBack: s.uri.queryParameters['next'] == 'back'),
    ),
    _pending(Routes.cart, 'Cart'),
    _pending(Routes.notifications, 'Notifications'),
    _pending(Routes.searchProduct, 'Search'),
    _pending(Routes.productList, 'Products'),
    _pending(Routes.productDetail, 'Product Detail'),
    _pending(Routes.ewaste, 'Sell e-waste'),
    _pending(Routes.amc, 'AMC plans'),
    _pending(Routes.deviceHealth, 'Device Health'),
    _pending(Routes.warranty, 'Check Your Warranty'),
    _pending(Routes.openBox, 'Open Box Deals'),
    _pending(Routes.bookAnInstallation, 'Book an Installation'),
    _pending(Routes.technicalSupport, 'Technical Support'),
    _pending(Routes.rentalList, 'Rental'),
    _pending(Routes.serviceCenter, 'Service Centers'),
  ],
);
