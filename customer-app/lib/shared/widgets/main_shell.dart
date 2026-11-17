import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

/// Bottom tabs — design-html/01-home-v2.html `.nav`: Home · Bookings · Shop · Account.
class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.shell});
  final StatefulNavigationShell shell;

  static const _tabs = [
    (Icons.home_rounded, Icons.home_outlined, 'Home'),
    (Icons.build_rounded, Icons.build_outlined, 'Bookings'),
    (Icons.shopping_bag_rounded, Icons.shopping_bag_outlined, 'Shop'),
    (Icons.person_rounded, Icons.person_outline_rounded, 'Account'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: shell,
      bottomNavigationBar: DecoratedBox(
        decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.line))),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 62,
            child: Row(children: [
              for (var i = 0; i < _tabs.length; i++)
                Expanded(
                  child: InkResponse(
                    radius: 36,
                    onTap: () => shell.goBranch(i, initialLocation: i == shell.currentIndex),
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(shell.currentIndex == i ? _tabs[i].$1 : _tabs[i].$2,
                          size: 22, color: shell.currentIndex == i ? AppColors.primary : AppColors.muted),
                      const SizedBox(height: 4),
                      Text(_tabs[i].$3,
                          style: AppText.body(11,
                              weight: shell.currentIndex == i ? FontWeight.w600 : FontWeight.w500,
                              color: shell.currentIndex == i ? AppColors.primary : AppColors.muted,
                              height: 1.2)),
                    ]),
                  ),
                ),
            ]),
          ),
        ),
      ),
    );
  }
}
