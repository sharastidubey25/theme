import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import 'app_tokens.dart';

/// Typography: Manrope (headings), Inter (body), JetBrains Mono (eyebrows).
abstract final class AppText {
  static TextStyle head(double size, {FontWeight weight = FontWeight.w800, Color color = AppColors.ink, double height = 1.15}) =>
      GoogleFonts.manrope(fontSize: size, fontWeight: weight, color: color, height: height, letterSpacing: -0.02 * size);

  static TextStyle body(double size, {FontWeight weight = FontWeight.w400, Color color = AppColors.ink2, double height = 1.5}) =>
      GoogleFonts.inter(fontSize: size, fontWeight: weight, color: color, height: height);

  static TextStyle eyebrow({Color color = AppColors.eyebrow}) =>
      GoogleFonts.jetBrainsMono(fontSize: 11, fontWeight: FontWeight.w500, color: color, letterSpacing: 1.5);

  static TextStyle mono(double size, {FontWeight weight = FontWeight.w500, Color color = AppColors.ink3}) =>
      GoogleFonts.jetBrainsMono(fontSize: size, fontWeight: weight, color: color);

  static final h1 = head(28);
  static final h2 = head(22);
  static final h3 = head(18, weight: FontWeight.w700);
  static final title = head(16, weight: FontWeight.w700);
  static final bodyL = body(16);
  static final bodyM = body(14);
  static final bodyS = body(12, color: AppColors.ink3);
  static final label = body(13, weight: FontWeight.w600, color: AppColors.ink2);
}

abstract final class AppTheme {
  static ThemeData light() {
    final base = ThemeData(useMaterial3: true, brightness: Brightness.light);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.white,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.primary2,
        surface: AppColors.surface,
        onSurface: AppColors.ink,
        error: AppColors.error,
        outline: AppColors.border,
      ),
      textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(bodyColor: AppColors.ink2, displayColor: AppColors.ink),
      dividerColor: AppColors.border,
      splashFactory: InkSparkle.splashFactory,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        foregroundColor: AppColors.ink,
        titleTextStyle: AppText.title,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: AppText.body(15, color: AppColors.ink3.withValues(alpha: .7)),
        labelStyle: AppText.label,
        border: _border(AppColors.border),
        enabledBorder: _border(AppColors.border),
        focusedBorder: _border(AppColors.primary, width: 1.5),
        errorBorder: _border(AppColors.error),
        focusedErrorBorder: _border(AppColors.error, width: 1.5),
      ),
    );
  }

  static OutlineInputBorder _border(Color c, {double width = 1}) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: c, width: width),
      );
}
