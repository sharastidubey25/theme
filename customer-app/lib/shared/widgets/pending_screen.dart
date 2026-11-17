import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import 'section_header.dart';

/// Stand-in for screens not yet migrated. Shows the route params it received
/// so navigation from redesigned screens can be verified.
class PendingScreen extends StatelessWidget {
  const PendingScreen({super.key, required this.title, this.params = const {}, this.inShell = false});
  final String title;
  final Map<String, String> params;
  final bool inShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray2,
      appBar: inShell ? null : AppBar(title: Text(title)),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Eyebrow('Coming next'),
              const SizedBox(height: 12),
              Text(title, style: AppText.h2, textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Text('This screen is being redesigned.', style: AppText.bodyM, textAlign: TextAlign.center),
              if (params.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(params.entries.map((e) => '${e.key}: ${e.value}').join('\n'),
                    style: AppText.mono(12), textAlign: TextAlign.center),
              ],
            ]),
          ),
        ),
      ),
    );
  }
}
