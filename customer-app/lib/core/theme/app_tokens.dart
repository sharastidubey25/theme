import 'package:flutter/material.dart';

/// Radii, spacing and shadows mirrored from the website tokens.
abstract final class AppRadius {
  static const sm = 10.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const pill = 999.0;
}

abstract final class AppSpace {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const xxl = 24.0;
  static const xxxl = 32.0;

  /// Horizontal page gutter for mobile screens.
  static const gutter = 20.0;
}

abstract final class AppShadows {
  // --shadow-sm
  static const sm = [
    BoxShadow(color: Color(0x0D0F172A), blurRadius: 2, offset: Offset(0, 1)),
    BoxShadow(color: Color(0x1A0F172A), blurRadius: 24, spreadRadius: -10, offset: Offset(0, 8)),
  ];
  // --shadow
  static const md = [
    BoxShadow(color: Color(0x290F172A), blurRadius: 40, spreadRadius: -16, offset: Offset(0, 18)),
    BoxShadow(color: Color(0x0F0F172A), blurRadius: 12, spreadRadius: -4, offset: Offset(0, 4)),
  ];
  // --glow-accent (primary buttons)
  static const glow = [
    BoxShadow(color: Color(0x8CFF8A1F), blurRadius: 36, spreadRadius: -8, offset: Offset(0, 10)),
  ];
}
