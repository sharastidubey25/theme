import 'package:customerapp/shared/widgets/app_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import 'support/test_app.dart';

Future<void> _pumpHome(WidgetTester t) async => pumpApp(t);

Future<void> _tapScrolled(WidgetTester t, Finder f) async {
  await t.scrollUntilVisible(f, 300, scrollable: find.byType(Scrollable).first);
  await t.pumpAndSettle();
  await t.tap(f);
  await t.pumpAndSettle();
}

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  final cases = <String, (Finder, String)>{
    'search': (find.text('Search laptops, printers, ink…'), 'Search'),
    'category tile': (find.text('Laptop'), 'Products'),
    'explore all': (find.text('Explore all\nproducts'), 'Products'),
    'tech support': (find.widgetWithText(AppButton, 'Know more'), 'Technical Support'),
    'rent tile': (find.text('Projector'), 'Rental'),
    'service centre': (find.text('Search by brand or city'), 'Service Centers'),
  };

  for (final c in cases.entries) {
    testWidgets('home → ${c.key} opens ${c.value.$2}', (t) async {
      await _pumpHome(t);
      await _tapScrolled(t, c.value.$1);
      expect(find.text('This screen is being redesigned.'), findsOneWidget);
      expect(find.widgetWithText(AppBar, c.value.$2), findsOneWidget);
    });
  }

  testWidgets('category tile passes RN category param', (t) async {
    await _pumpHome(t);
    await _tapScrolled(t, find.text('Rack & Tower Servers'));
    expect(find.text('category: Servers'), findsOneWidget);
  });

  testWidgets('bottom nav switches tabs and Book now goes to repair tab', (t) async {
    await _pumpHome(t);
    await t.tap(find.text('E-Waste'));
    await t.pumpAndSettle();
    expect(find.text('This screen is being redesigned.'), findsOneWidget);
    await t.tap(find.text('Home'));
    await t.pumpAndSettle();
    await t.tap(find.text('Book now'));
    await t.pumpAndSettle();
    expect(find.text('Book a Repair'), findsWidgets);
    expect(find.text('This screen is being redesigned.'), findsOneWidget);
  });
}
