import 'package:flutter/material.dart';

/// Colour tokens mirrored from the website (`/new-home/css/home.css` :root).
abstract final class AppColors {
  // Brand
  static const primary = Color(0xFFFF6A00);
  static const primary2 = Color(0xFFFF8A1F);
  static const primary3 = Color(0xFFFDBA74);
  static const accent2 = Color(0xFFFFA24D);
  static const eyebrow = Color(0xFFE85D04);
  static const primarySoft = Color(0xFFFFF4EC);

  // Ink / navy
  static const navy = Color(0xFF0B1220);
  static const navy2 = Color(0xFF111A2E);
  static const navy3 = Color(0xFF1A2540);
  static const ink = Color(0xFF0B1220);
  static const ink2 = Color(0xFF1E293B);
  static const ink3 = Color(0xFF475569);

  // Surfaces
  static const white = Color(0xFFFFFFFF);
  static const surface = Color(0xFFFFFFFF);
  static const gray2 = Color(0xFFF1F5F9);
  static const border = Color(0xFFE8EBF1);
  static const borderStrong = Color(0xFFD5DBE5);

  // v2 minimal redesign (design-html/*-v2.html)
  static const line = Color(0xFFEEF0F4);
  static const bg2 = Color(0xFFF6F7F9);
  static const muted = Color(0xFF94A3B8);
  static const disabled = Color(0xFFE2E8F0);
  static const blue = Color(0xFF2563EB);
  static const blueSoft = Color(0xFFEFF6FF);

  // Status
  static const green = Color(0xFF16A34A);
  static const greenSoft = Color(0xFFDCFCE7);
  static const error = Color(0xFFDC2626);
  static const errorSoft = Color(0xFFFEE2E2);
  static const warning = Color(0xFFF59E0B);

  // Gradients
  static const gradPrimary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primary2, accent2],
    stops: [0, .7, 1],
  );
  static const gradAccent = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary2, accent2],
  );
  static const gradDark = LinearGradient(
    begin: Alignment(-.3, -1),
    end: Alignment(.3, 1),
    colors: [navy, navy2, Color(0xFF16254A)],
    stops: [0, .6, 1],
  );
}
